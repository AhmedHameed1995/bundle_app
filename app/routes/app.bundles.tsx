import { useState, useCallback } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  Banner,
  EmptyState,
  InlineStack,
  Tabs,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { BundleTypeModal } from "../components/BundleTypeModal";
import { CreateBundleModal } from "../components/CreateBundleModal";
import { BundleTable, BundleItem, BundleType, BundleStatus } from "../components/BundleTable";
import db from "../db.server";
import * as crypto from "crypto";

type LoaderData = {
  bundles: Array<{
    id: string;
    title: string;
    type: BundleType;
    status: BundleStatus;
    productId: string;
    productCount: number;
    price: string | null;
    [key: string]: unknown;
  }>;
};

type ActionData = 
  | { error: string; success?: undefined; bundle?: undefined }
  | { success: boolean; bundle: any; error?: undefined };

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  try {
    // Check if the bundle model exists in the database schema
    const bundleTableExists = await db.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'Bundle'
      );
    ` as Array<{exists: boolean}>;
    
    let bundles: any[] = [];
    if (bundleTableExists[0]?.exists) {
      try {
        // Use regular query approach if table exists
        bundles = await db.$queryRaw`
          SELECT b.* 
          FROM "Bundle" b
          WHERE b."shop" = ${session.shop}
        ` as any[];
        
        // Count products for each bundle
        for (const bundle of bundles) {
          try {
            const countResult = await db.$queryRaw`
              SELECT COUNT(*) as "productCount"
              FROM "BundleItem" 
              WHERE "bundleId" = ${bundle.id}
            ` as any[];
            bundle.productCount = parseInt(countResult[0]?.productCount || '0');
          } catch (err) {
            console.error("Error counting bundle items:", err);
            bundle.productCount = 0;
          }
        }
      } catch (err) {
        console.error("Error querying bundles:", err);
      }
    }

    // Transform bundles for the frontend
    const transformedBundles = bundles.map((bundle: any) => ({
      id: bundle.id,
      title: bundle.title,
      type: bundle.type,
      status: bundle.status,
      productId: bundle.productId,
      productCount: bundle.productCount || 0,
      price: null, // We would need to fetch this from the Shopify API
    }));

    return json<LoaderData>({
      bundles: transformedBundles,
    });
  } catch (error) {
    console.error("Error loading bundles:", error);
    // Return empty bundles array on error
    return json<LoaderData>({
      bundles: [],
    });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  
  const formData = await request.formData();
  const action = formData.get("action");

  if (action === "create_bundle") {
    const title = formData.get("title") as string;
    const typeStr = formData.get("type") as string;
    const isNewProduct = formData.get("isNewProduct") === "true";

    try {
      // Create a new product in Shopify for the bundle
      const response = await admin.graphql(
        `#graphql
        mutation productCreate($input: ProductInput!) {
          productCreate(input: $input) {
            product {
              id
              title
            }
            userErrors {
              field
              message
            }
          }
        }`,
        {
          variables: {
            input: {
              title,
              productType: "Bundle",
            },
          },
        }
      );

      const responseJson = await response.json();
      const userErrors = responseJson.data?.productCreate?.userErrors;
      
      if (userErrors && userErrors.length > 0) {
        return json<ActionData>({ error: userErrors[0].message });
      }

      const productId = responseJson.data?.productCreate?.product?.id?.replace(
        "gid://shopify/Product/",
        ""
      );

      try {
        // Just use direct SQL insertion to avoid type casting issues
        const bundleId = crypto.randomUUID();
        const now = new Date();
        
        // Insert directly using SQL to avoid Prisma client type issues
        if (typeStr === BundleType.SIMPLE || typeStr === BundleType.INFINITE_OPTIONS) {
          // Directly execute SQL with explicit casting to the enum types
          await db.$executeRawUnsafe(`
            INSERT INTO "Bundle" ("id", "shop", "title", "type", "productId", "status", "createdAt", "updatedAt")
            VALUES (
              '${bundleId}', 
              '${session.shop}', 
              '${title}', 
              '${typeStr}'::\"BundleType\", 
              '${productId}', 
              'ACTIVE'::\"BundleStatus\", 
              '${now.toISOString()}'::timestamp, 
              '${now.toISOString()}'::timestamp
            )
          `);
          
          return json<ActionData>({ 
            success: true, 
            bundle: {
              id: bundleId,
              title,
              type: typeStr,
              productId,
              status: 'ACTIVE'
            } 
          });
        } else {
          return json<ActionData>({ error: "Invalid bundle type provided" });
        }
      } catch (dbError) {
        console.error("Database error creating bundle:", dbError);
        return json<ActionData>({ error: "Failed to save bundle in database: " + (dbError as Error).message });
      }
    } catch (error) {
      console.error("Error creating bundle:", error);
      return json<ActionData>({ error: "Failed to create bundle" });
    }
  }

  return null;
};

export default function Bundles() {
  const { bundles } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const submit = useSubmit();

  const [bundleTypeModalOpen, setBundleTypeModalOpen] = useState(false);
  const [createBundleModalOpen, setCreateBundleModalOpen] = useState(false);
  const [selectedBundleType, setSelectedBundleType] = useState<BundleType | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(true);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);

  const isLoading = navigation.state === "submitting";
  const hasError = actionData && 'error' in actionData;
  const hasSuccess = actionData && 'success' in actionData;

  const handleBundleTypeSelection = useCallback((type: BundleType) => {
    setSelectedBundleType(type);
    setBundleTypeModalOpen(false);
    setCreateBundleModalOpen(true);
  }, []);

  const handleCreateBundle = useCallback(
    (data: { title: string }) => {
      if (!selectedBundleType) return;

      const formData = new FormData();
      formData.append("action", "create_bundle");
      formData.append("title", data.title);
      formData.append("type", selectedBundleType.toString());
      formData.append("isNewProduct", String(isNewProduct));

      submit(formData, { method: "post" });
      setCreateBundleModalOpen(false);
    },
    [selectedBundleType, isNewProduct, submit]
  );

  const handleEditBundle = useCallback((id: string) => {
    // Implement edit functionality
    console.log("Edit bundle:", id);
  }, []);

  const handleTabChange = useCallback(
    (selectedTabIndex: number) => setSelectedTabIndex(selectedTabIndex),
    [],
  );

  const tabs = [
    {
      id: 'all',
      content: 'All',
    },
    {
      id: 'simple',
      content: 'Simple Bundles',
    },
    {
      id: 'infinite',
      content: 'Infinite Options Bundles',
    },
  ];

  // Filter bundles based on selected tab
  const filteredBundles = bundles.filter((bundle: any) => {
    if (selectedTabIndex === 0) return true;
    if (selectedTabIndex === 1) return bundle.type === BundleType.SIMPLE;
    if (selectedTabIndex === 2) return bundle.type === BundleType.INFINITE_OPTIONS;
    return true;
  });

  // Transform bundles to match BundleItem interface
  const bundleItems: BundleItem[] = filteredBundles.map((bundle: any) => ({
    ...bundle,
    price: bundle.price || undefined
  }));

  return (
    <Page
      title="Bundles"
      primaryAction={{
        content: "Build bundle",
        onAction: () => setBundleTypeModalOpen(true),
      }}
    >
      <TitleBar title="Bundles" />

      <BlockStack gap="500">
        {hasError && actionData && 'error' in actionData && (
          <Banner
            title="There was an error creating the bundle"
            tone="critical"
          >
            <p>{actionData.error}</p>
          </Banner>
        )}

        {hasSuccess && (
          <Banner
            title="Bundle created successfully"
            tone="success"
            onDismiss={() => {}}
          />
        )}

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Manage your bundles in bulk
            </Text>
            <Text as="p" variant="bodyMd">
              Easily edit, create, and delete multiple bundles at once directly on Shopify or using the bulk import feature.{" "}
              <Button variant="plain" url="#">
                Learn more
              </Button>
            </Text>
          </BlockStack>
        </Card>

        <Card>
          <Tabs
            tabs={tabs}
            selected={selectedTabIndex}
            onSelect={handleTabChange}
          />
          {filteredBundles.length === 0 ? (
            <div>
              <EmptyState
                heading="Create your first bundle"
                action={{ content: "Build bundle", onAction: () => setBundleTypeModalOpen(true) }}
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>
                  Create bundle products to sell multiple items together or offer mix-and-match options.
                </p>
              </EmptyState>
            </div>
          ) : (
            <div>
              <BundleTable bundles={bundleItems} onEdit={handleEditBundle} />
            </div>
          )}
        </Card>
      </BlockStack>

      <BundleTypeModal
        open={bundleTypeModalOpen}
        onClose={() => setBundleTypeModalOpen(false)}
        onSelectType={handleBundleTypeSelection}
      />

      {selectedBundleType && (
        <CreateBundleModal
          open={createBundleModalOpen}
          onClose={() => setCreateBundleModalOpen(false)}
          bundleType={selectedBundleType}
          onSubmit={handleCreateBundle}
          isNewProduct={isNewProduct}
        />
      )}
    </Page>
  );
} 