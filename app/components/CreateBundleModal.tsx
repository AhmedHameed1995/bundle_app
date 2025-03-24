import React, { useState } from 'react';
import { Modal, TextField, Form, FormLayout } from '@shopify/polaris';
import { BundleType } from './BundleTable';

interface CreateBundleModalProps {
  open: boolean;
  onClose: () => void;
  bundleType: BundleType;
  onSubmit: (data: { title: string }) => void;
  isNewProduct: boolean;
}

export function CreateBundleModal({
  open,
  onClose,
  bundleType,
  onSubmit,
  isNewProduct
}: CreateBundleModalProps) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    setLoading(true);
    onSubmit({ title });
  };

  const modalTitle = bundleType === BundleType.SIMPLE 
    ? 'Create simple bundle' 
    : 'Create infinite options bundle';

  const description = isNewProduct
    ? 'A new product will be created and used as your bundle.'
    : 'An existing product will be used as your bundle.';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={modalTitle}
      primaryAction={{
        content: 'Create',
        onAction: handleSubmit,
        loading: loading,
        disabled: !title,
      }}
      secondaryActions={[
        {
          content: 'Cancel',
          onAction: onClose,
        },
      ]}
    >
      <Modal.Section>
        <Form onSubmit={handleSubmit}>
          <FormLayout>
            <TextField
              label="Bundle title"
              value={title}
              onChange={setTitle}
              autoComplete="off"
              helpText={description}
            />
          </FormLayout>
        </Form>
      </Modal.Section>
    </Modal>
  );
} 