import React from 'react';
import {Modal, Button, Text, BlockStack, Link} from '@shopify/polaris';
import { BundleType } from './BundleTable';

export interface BundleTypeModalProps {
  open: boolean;
  onClose: () => void;
  onSelectType: (type: BundleType) => void;
}

export function BundleTypeModal({
  open,
  onClose,
  onSelectType,
}: BundleTypeModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Select bundle type"
      primaryAction={{
        content: 'Cancel',
        onAction: onClose,
      }}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <div style={{ border: '1px solid #c4cdd5', borderRadius: '8px', padding: '16px', cursor: 'pointer' }} 
               onClick={() => onSelectType(BundleType.SIMPLE)}>
            <BlockStack gap="200">
              <Text variant="headingSm" as="h3">Simple Bundle</Text>
              <Text variant="bodyMd" as="p">
                Recommended for bundles with a fixed set of products or limited bundle variants.
              </Text>
            </BlockStack>
          </div>

          <div style={{ border: '1px solid #c4cdd5', borderRadius: '8px', padding: '16px', cursor: 'pointer' }} 
               onClick={() => onSelectType(BundleType.INFINITE_OPTIONS)}>
            <BlockStack gap="200">
              <Text variant="headingSm" as="h3">Infinite Options Bundle</Text>
              <Text variant="bodyMd" as="p">
                Recommended for bundles that exceed Shopify's 100 variant and 3 option limit or
                require more complex bundle offerings such as mix-and-match bundles.
              </Text>
            </BlockStack>
          </div>

          <div style={{ textAlign: 'right' }}>
            <Link url="https://help.shopify.com/en/manual/products/variants" external>
              Learn more
            </Link>
          </div>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
} 