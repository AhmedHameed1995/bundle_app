import { useState, useCallback } from "react";
import {
  Modal,
  TextField,
  BlockStack,
  ResourceList,
  ResourceItem,
  Thumbnail,
  Text,
  Button,
  Checkbox,
  InlineStack,
  Badge,
} from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";

export interface Product {
  id: string;
  title: string;
  imageUrl?: string;
  price?: string;
  variant?: string;
}

interface ProductSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (products: Product[]) => void;
  maxSelections?: number;
  initialSelectedProducts?: Product[];
}

export function ProductSelector({
  open,
  onClose,
  onSelect,
  maxSelections = 1,
  initialSelectedProducts = [],
}: ProductSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Product[]>(initialSelectedProducts);
  const [isLoading, setIsLoading] = useState(false);

  // Mock products - in a real app, these would come from the Shopify API
  const products: Product[] = [
    {
      id: "1",
      title: "Basic T-Shirt",
      imageUrl: "https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg",
      price: "$19.99",
    },
    {
      id: "2",
      title: "Premium Hoodie",
      imageUrl: "https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg",
      price: "$49.99",
    },
    {
      id: "3",
      title: "Slim Fit Jeans",
      imageUrl: "https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg",
      price: "$39.99",
    },
    {
      id: "4",
      title: "Summer Dress",
      imageUrl: "https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg",
      price: "$29.99",
    },
  ];

  const filteredProducts = searchTerm
    ? products.filter((product) =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products;

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handleSelect = useCallback(
    (product: Product) => {
      setSelectedProducts((currentSelected) => {
        const isSelected = currentSelected.some((p) => p.id === product.id);
        
        if (isSelected) {
          // Remove from selection
          return currentSelected.filter((p) => p.id !== product.id);
        } else if (currentSelected.length < maxSelections) {
          // Add to selection
          return [...currentSelected, product];
        }
        
        return currentSelected;
      });
    },
    [maxSelections]
  );

  const handleAdd = useCallback(() => {
    onSelect(selectedProducts);
    onClose();
  }, [onSelect, onClose, selectedProducts]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Select products"
      primaryAction={{
        content: "Add",
        onAction: handleAdd,
        disabled: selectedProducts.length === 0,
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: onClose,
        },
      ]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <TextField
            label="Search products"
            value={searchTerm}
            onChange={handleSearch}
            autoComplete="off"
            prefix={<SearchIcon />}
            placeholder="Search products"
            labelHidden
          />

          <ResourceList
            resourceName={{ singular: "product", plural: "products" }}
            items={filteredProducts}
            loading={isLoading}
            renderItem={(product) => {
              const { id, title, imageUrl, price } = product;
              const isSelected = selectedProducts.some((p) => p.id === id);

              return (
                <ResourceItem
                  id={id}
                  onClick={() => handleSelect(product)}
                  media={
                    <Thumbnail
                      source={imageUrl || ""}
                      alt={title}
                      size="small"
                    />
                  }
                  accessibilityLabel={`Select ${title}`}
                >
                  <InlineStack gap="400" align="space-between" blockAlign="center">
                    <BlockStack gap="100">
                      <Text variant="bodyMd" as="p" fontWeight="bold">
                        {title}
                      </Text>
                      <Text variant="bodySm" as="p" tone="subdued">
                        1 variant
                      </Text>
                    </BlockStack>
                    <InlineStack gap="400" blockAlign="center">
                      <Text variant="bodyMd" as="p">
                        {price}
                      </Text>
                      <Checkbox
                        label=""
                        labelHidden
                        checked={isSelected}
                        onChange={() => handleSelect(product)}
                      />
                    </InlineStack>
                  </InlineStack>
                </ResourceItem>
              );
            }}
          />

          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <Text as="p" variant="bodySm">
              {selectedProducts.length}/{maxSelections} products selected
            </Text>
          </div>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
} 