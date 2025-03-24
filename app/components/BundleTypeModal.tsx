import React from 'react';
import { Modal, Card, Button, Text, BlockStack, Box } from '@shopify/polaris';
import { BundleType } from './BundleTable';

interface BundleTypeModalProps {
  open: boolean;
  onClose: () => void;
  onSelectType: (type: BundleType) => void;
}

export function BundleTypeModal({ open, onClose, onSelectType }: BundleTypeModalProps) {
  const handleSelect = (type: BundleType) => {
    onSelectType(type);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Choose bundle type"
      secondaryActions={[
        {
          content: 'Cancel',
          onAction: onClose,
        },
      ]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <Text as="p" variant="bodyMd">
            Choose the type of bundle you want to create:
          </Text>

          <Box padding="400">
            <Card padding="400">
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Simple Bundle
                </Text>
                <Text as="p" variant="bodyMd">
                  Create a bundle with a fixed set of products. Customers cannot customize the products in this bundle.
                </Text>
                <Button 
                  variant="primary" 
                  onClick={() => handleSelect(BundleType.SIMPLE)}
                >
                  Create Simple Bundle
                </Button>
              </BlockStack>
            </Card>
          </Box>

          <Box padding="400">
            <Card padding="400">
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Infinite Options Bundle
                </Text>
                <Text as="p" variant="bodyMd">
                  Create a customizable bundle that allows customers to mix and match products from predefined collections.
                </Text>
                <Button 
                  onClick={() => handleSelect(BundleType.INFINITE_OPTIONS)}
                >
                  Create Infinite Options Bundle
                </Button>
              </BlockStack>
            </Card>
          </Box>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
} 