import React from "react";
import { useNavigate } from "@remix-run/react";
import {
  Badge,
  Button,
  EmptySearchResult,
  IndexTable,
  Text,
  Tooltip,
  ButtonProps,
} from "@shopify/polaris";

// Define enums to match what would be in Prisma
export enum BundleType {
  SIMPLE = "SIMPLE",
  INFINITE_OPTIONS = "INFINITE_OPTIONS"
}

export enum BundleStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  DRAFT = "DRAFT"
}

export interface BundleItem {
  id: string;
  title: string;
  type: BundleType;
  status: BundleStatus;
  productId: string;
  productCount: number;
  price?: string;
}

export interface BundleTableProps {
  bundles: BundleItem[];
  onEdit: (id: string) => void;
}

export function BundleTable({ bundles, onEdit }: BundleTableProps) {
  const navigate = useNavigate();

  if (bundles.length === 0) {
    return <EmptySearchResult
      title="No bundles found"
      description="Try changing the filters or search term"
      withIllustration
    />;
  }

  const resourceName = {
    singular: "bundle",
    plural: "bundles",
  };

  const rowMarkup = bundles.map(
    ({ id, title, type, status, productCount, price }, index) => (
      <IndexTable.Row
        id={id}
        key={id}
        position={index}
      >
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {title}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" as="span">
            {getBundleTypeBadge(type)}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" as="span">
            {getBundleStatusBadge(status)}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" as="span">
            {productCount}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" as="span">
            {price || "-"}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <form action={`/app/bundles/${id}`} method="get">
              <input type="hidden" name="mode" value="edit" />
              <Button
                variant="tertiary"
                size="slim"
                submit
              >
                Edit
              </Button>
            </form>
            
            <form action={`/app/bundles/${id}`} method="get">
              <Button
                variant="tertiary"
                size="slim"
                submit
              >
                View
              </Button>
            </form>
          </div>
        </IndexTable.Cell>
      </IndexTable.Row>
    )
  );

  return (
    <IndexTable
      resourceName={resourceName}
      itemCount={bundles.length}
      headings={[
        { title: "Title" },
        { title: "Type" },
        { title: "Status" },
        { title: "Products" },
        { title: "Price" },
        { title: "Actions" },
      ]}
      selectable={false}
    >
      {rowMarkup}
    </IndexTable>
  );
}

function getBundleTypeBadge(type: BundleType) {
  switch (type) {
    case BundleType.SIMPLE:
      return <Badge tone="info">Simple</Badge>;
    case BundleType.INFINITE_OPTIONS:
      return <Badge tone="success">Infinite Options</Badge>;
    default:
      return <Badge>{type}</Badge>;
  }
}

function getBundleStatusBadge(status: BundleStatus) {
  switch (status) {
    case BundleStatus.ACTIVE:
      return <Badge tone="success">Active</Badge>;
    case BundleStatus.INACTIVE:
      return <Badge tone="warning">Inactive</Badge>;
    case BundleStatus.DRAFT:
      return <Badge tone="attention">Draft</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
} 