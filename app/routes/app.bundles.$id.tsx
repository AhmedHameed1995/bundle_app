import { useState, useEffect } from "react";
import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, Link, useSubmit, Form, useSearchParams } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  Badge,
  BlockStack,
  Box,
  TextField,
  RadioButton,
  Thumbnail,
  InlineStack,
  Banner,
} from "@shopify/polaris";
import { ArrowLeftIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { BundleType, BundleStatus } from "../components/BundleTable";
import db from "../db.server";

interface LoaderData {
  bundle: {
    id: string;
    title: string;
    type: BundleType;
    status: BundleStatus;
    productId: string;
    price: string;
    items: Array<{
      id: string;
      title: string;
      imageUrl?: string;
      price?: string;
      variant?: string;
    }>;
  };
}

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const { session, admin, redirect } = await authenticate.admin(request);
  const { id } = params;

  if (!id) {
    return redirect("/app/bundles");
  }

  try {
    // Get bundle details
    const bundleData = await db.$queryRaw`
      SELECT * FROM Bundle WHERE id = ${id} AND shop = ${session.shop}
    ` as any[];

    if (!bundleData || bundleData.length === 0) {
      return redirect("/app/bundles");
    }

    const bundle = bundleData[0];

    // Get bundle items
    const itemsData = await db.$queryRaw`
      SELECT * FROM BundleItem WHERE bundleId = ${id}
    ` as any[];

    const items = itemsData.map((item: any) => ({
      id: item.id,
      title: item.productId, // In a real app, you would fetch the product title from Shopify
      imageUrl: "https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg",
      price: "$0.00",
      variant: "Default",
    }));

    return json<LoaderData>({
      bundle: {
        id: bundle.id,
        title: bundle.title,
        type: bundle.type as BundleType,
        status: bundle.status as BundleStatus,
        productId: bundle.productId,
        price: "$15.99", // In a real app, you would fetch the price from Shopify
        items,
      },
    });
  } catch (error) {
    console.error("Error fetching bundle details:", error);
    return redirect("/app/bundles");
  }
};

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const { session, redirect } = await authenticate.admin(request);
  const { id } = params;

  if (!id) {
    return redirect("/app/bundles");
  }

  const formData = await request.formData();
  const action = formData.get("action") as string;

  if (action === "update_bundle") {
    const title = formData.get("title") as string;
    const price = formData.get("price") as string;
    const buildOption = formData.get("buildOption") as string;
    const status = formData.get("status") as BundleStatus;

    try {
      // Update bundle in database
      await db.$executeRawUnsafe(`
        UPDATE Bundle 
        SET 
          title = '${title}',
          status = '${status}',
          updatedAt = '${new Date().toISOString()}'
        WHERE id = '${id}' AND shop = '${session.shop}'
      `);

      return json({ success: true });
    } catch (error) {
      console.error("Error updating bundle:", error);
      return json({ success: false, error: "Failed to update bundle" }, { status: 500 });
    }
  }

  return null;
};

export default function BundleDetails() {
  const { bundle } = useLoaderData<LoaderData>();
  const navigate = useNavigate();
  const submit = useSubmit();
  const [searchParams] = useSearchParams();
  
  // Check if we're in edit mode
  const isEditMode = searchParams.get("mode") === "edit";
  
  // Form state
  const [title, setTitle] = useState(bundle.title);
  const [price, setPrice] = useState(bundle.price || "");
  const [buildOption, setBuildOption] = useState("quick");
  const [status, setStatus] = useState<BundleStatus>(bundle.status);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Track form changes
  useEffect(() => {
    const hasFormChanges = 
      title !== bundle.title ||
      price !== bundle.price ||
      status !== bundle.status;
    
    setHasChanges(hasFormChanges);
  }, [title, price, status, bundle]);

  // Handle form submission
  const handleSave = () => {
    setSaving(true);
    
    const formData = new FormData();
    formData.append("action", "update_bundle");
    formData.append("title", title);
    formData.append("price", price);
    formData.append("buildOption", buildOption);
    formData.append("status", status);
    
    submit(formData, { method: "post" });
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditMode) {
      window.location.href = `/app/bundles/${bundle.id}`;
    } else {
      window.location.href = `/app/bundles/${bundle.id}?mode=edit`;
    }
  };

  return (
    <Page
      backAction={{ content: "Back", onAction: () => navigate("/app/bundles") }}
      title={isEditMode ? `Editing: ${bundle.title}` : bundle.title}
      titleMetadata={
        <Badge tone={bundle.status === BundleStatus.ACTIVE ? "success" : "info"}>
          {bundle.status === BundleStatus.ACTIVE ? "Active" : "Draft"}
        </Badge>
      }
      secondaryActions={[
        {
          content: "View in Shopify",
          url: `https://admin.shopify.com/products/${bundle.productId}`,
          target: "_blank"
        },
        {
          content: isEditMode ? "Cancel" : "Edit bundle",
          onAction: toggleEditMode,
        },
      ]}
      primaryAction={isEditMode ? {
        content: "Save",
        onAction: handleSave,
        loading: saving,
        disabled: !hasChanges
      } : undefined}
    >
      <BlockStack gap="500">
        <Form method="post">
          <Layout>
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Bundle product
                  </Text>

                  <InlineStack gap="400" blockAlign="center">
                    <Thumbnail
                      source={bundle.items[0]?.imageUrl || "https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"}
                      alt={bundle.title}
                      size="medium"
                    />
                    <BlockStack>
                      {isEditMode ? (
                        <TextField
                          label="Bundle title"
                          value={title}
                          onChange={setTitle}
                          autoComplete="off"
                        />
                      ) : (
                        <>
                          <Link to={`https://admin.shopify.com/products/${bundle.productId}`}>
                            {bundle.title}
                          </Link>
                          <Text variant="bodySm" as="p" tone="subdued">1 variant</Text>
                        </>
                      )}
                    </BlockStack>
                  </InlineStack>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Infinite options selector widget
                  </Text>
                  <Text as="p">
                    Turn widget on or off, adjust placement, customize styles, all from your theme editor.
                  </Text>
                  <Button>Open theme editor</Button>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Preview
                  </Text>
                  <div style={{ height: "100px", background: "#f4f6f8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Text as="p">Widget preview would appear here</Text>
                  </div>
                </BlockStack>
              </Card>
            </Layout.Section>

            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Bundle details
                  </Text>
                  
                  <Text as="p">Inventory not tracked in Shopify.</Text>
                  
                  <BlockStack gap="200">
                    <Text variant="headingSm" as="h3">
                      Price
                    </Text>
                    <TextField
                      label=""
                      type="text"
                      value={price}
                      prefix="$"
                      onChange={setPrice}
                      autoComplete="off"
                      disabled={!isEditMode}
                    />
                  </BlockStack>

                  {isEditMode && (
                    <BlockStack gap="200">
                      <Text variant="headingSm" as="h3">
                        Status
                      </Text>
                      <InlineStack gap="400">
                        <RadioButton
                          label="Active"
                          checked={status === BundleStatus.ACTIVE}
                          id="status-active"
                          name="status"
                          onChange={() => setStatus(BundleStatus.ACTIVE)}
                        />
                        <RadioButton
                          label="Draft"
                          checked={status === BundleStatus.DRAFT}
                          id="status-draft"
                          name="status"
                          onChange={() => setStatus(BundleStatus.DRAFT)}
                        />
                      </InlineStack>
                    </BlockStack>
                  )}
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Bundle assembly
                  </Text>
                  
                  <BlockStack gap="400">
                    <RadioButton
                      label="Quickly build using existing product variants"
                      helpText="Most popular"
                      checked={buildOption === "quick"}
                      id="quick"
                      name="buildOption"
                      onChange={() => setBuildOption("quick")}
                      disabled={!isEditMode}
                    />
                    <RadioButton
                      label="Manually build by creating new product options for high customization"
                      checked={buildOption === "manual"}
                      id="manual"
                      name="buildOption"
                      onChange={() => setBuildOption("manual")}
                      disabled={!isEditMode}
                    />
                  </BlockStack>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Products
                  </Text>
                  
                  <Text as="p">Add products and customize options to your bundle.</Text>
                  
                  {isEditMode && (
                    <InlineStack gap="200">
                      <Button>Add products</Button>
                      <Button>Add product with variants</Button>
                    </InlineStack>
                  )}
                  
                  {bundle.items.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center" }}>
                      <Text as="p">No products added yet. Add products to your bundle.</Text>
                    </div>
                  ) : (
                    <BlockStack gap="400">
                      {bundle.items.map((item) => (
                        <InlineStack key={item.id} gap="400" align="space-between" blockAlign="center">
                          <InlineStack gap="400" blockAlign="center">
                            <Thumbnail
                              source={item.imageUrl || "https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"}
                              alt={item.title}
                              size="small"
                            />
                            <Text variant="bodyMd" as="p" fontWeight="bold">{item.title}</Text>
                          </InlineStack>
                          <InlineStack gap="200">
                            <Text variant="bodyMd" as="p">{item.price}</Text>
                            {isEditMode && (
                              <Button variant="plain">
                                Remove
                              </Button>
                            )}
                          </InlineStack>
                        </InlineStack>
                      ))}
                    </BlockStack>
                  )}
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>
        </Form>
      </BlockStack>
    </Page>
  );
} 