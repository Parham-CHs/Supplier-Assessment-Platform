"use client";

import { useState } from "react";
import { Button, Input, Label } from "@/components/ui";
import { useApp } from "@/components/app-provider";
import type { Supplier } from "@/lib/types";
import { PackagePlus, Pencil, X } from "lucide-react";

export function SupplierProductsManager({ supplier }: { supplier: Supplier }) {
  const {
    data,
    addProduct,
    updateProduct,
    assignProductToSupplier,
    removeProductFromSupplier,
  } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingLinkId, setSavingLinkId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newSku, setNewSku] = useState("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editSku, setEditSku] = useState("");

  const startEditing = (product: (typeof data.products)[number]) => {
    setEditingProductId(product.id);
    setEditName(product.name);
    setEditCategory(product.category);
    setEditSku(product.sku);
    setError("");
  };

  const saveNewProduct = async () => {
    if (!newName.trim() || !newSku.trim()) return;
    setSaving(true);
    setError("");
    try {
      await addProduct({
        name: newName.trim(),
        category: newCategory.trim(),
        sku: newSku.trim(),
        supplierIds: [supplier.id],
      });
      setNewName("");
      setNewCategory("");
      setNewSku("");
      setIsAdding(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not add product.",
      );
    } finally {
      setSaving(false);
    }
  };

  const saveProductEdit = async () => {
    if (!editingProductId || !editName.trim() || !editSku.trim()) return;
    setSaving(true);
    setError("");
    try {
      await updateProduct(editingProductId, {
        name: editName.trim(),
        category: editCategory.trim(),
        sku: editSku.trim(),
      });
      setEditingProductId(null);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not update product.",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleProduct = async (productId: string, linked: boolean) => {
    setSavingLinkId(productId);
    setError("");
    try {
      if (linked) {
        await removeProductFromSupplier(supplier.id, productId);
      } else {
        await assignProductToSupplier(supplier.id, productId);
      }
    } catch (linkError) {
      setError(
        linkError instanceof Error
          ? linkError.message
          : "Could not update supplier products.",
      );
    } finally {
      setSavingLinkId(null);
    }
  };

  return (
    <>
      <Button variant="secondary" onClick={() => setIsOpen(true)}>
        <PackagePlus size={15} />
        Manage products
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 grid place-items-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`supplier-products-title-${supplier.id}`}
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
          >
            <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
              <div>
                <h2
                  id={`supplier-products-title-${supplier.id}`}
                  className="font-bold"
                >
                  Manage products
                </h2>
                <p className="mt-1 text-sm text-muted">{supplier.name}</p>
              </div>
              <button
                type="button"
                aria-label="Close product manager"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-muted hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </header>

            <div className="space-y-5 overflow-y-auto p-5">
              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">Product catalog</h3>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setIsAdding((current) => !current);
                      setError("");
                    }}
                  >
                    <PackagePlus size={15} />
                    {isAdding ? "Cancel new product" : "Add new product"}
                  </Button>
                </div>

                {isAdding && (
                  <div className="mb-4 grid gap-3 rounded-lg border border-line p-4 sm:grid-cols-3">
                    <div>
                      <Label>Product name *</Label>
                      <Input
                        value={newName}
                        onChange={(event) => setNewName(event.target.value)}
                        placeholder="Product name"
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Input
                        value={newCategory}
                        onChange={(event) => setNewCategory(event.target.value)}
                        placeholder="Category"
                      />
                    </div>
                    <div>
                      <Label>SKU *</Label>
                      <Input
                        value={newSku}
                        onChange={(event) => setNewSku(event.target.value)}
                        placeholder="SKU-001"
                      />
                    </div>
                    <div className="sm:col-span-3 sm:flex sm:justify-end">
                      <Button
                        onClick={() => void saveNewProduct()}
                        disabled={saving || !newName.trim() || !newSku.trim()}
                      >
                        {saving ? "Saving…" : "Add product"}
                      </Button>
                    </div>
                  </div>
                )}

                {error && (
                  <p role="alert" className="mb-3 text-sm text-red-700">
                    {error}
                  </p>
                )}

                <div className="divide-y divide-line rounded-lg border border-line">
                  {data.products.map((product) => {
                    const linked = supplier.products.includes(product.id);
                    const editing = editingProductId === product.id;

                    return (
                      <div key={product.id} className="p-3">
                        {editing ? (
                          <div className="grid gap-3 sm:grid-cols-3">
                            <div>
                              <Label>Product name *</Label>
                              <Input
                                value={editName}
                                onChange={(event) =>
                                  setEditName(event.target.value)
                                }
                              />
                            </div>
                            <div>
                              <Label>Category</Label>
                              <Input
                                value={editCategory}
                                onChange={(event) =>
                                  setEditCategory(event.target.value)
                                }
                              />
                            </div>
                            <div>
                              <Label>SKU *</Label>
                              <Input
                                value={editSku}
                                onChange={(event) =>
                                  setEditSku(event.target.value)
                                }
                              />
                            </div>
                            <div className="flex justify-end gap-2 sm:col-span-3">
                              <Button
                                variant="secondary"
                                onClick={() => setEditingProductId(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={() => void saveProductEdit()}
                                disabled={
                                  saving || !editName.trim() || !editSku.trim()
                                }
                              >
                                {saving ? "Saving…" : "Save changes"}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium">
                                {product.name}
                              </p>
                              <p className="mt-1 text-xs text-muted">
                                {product.category || "No category"} · {product.sku}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                aria-label={`Edit ${product.name}`}
                                title="Edit product details"
                                onClick={() => startEditing(product)}
                              >
                                <Pencil size={15} />
                              </Button>
                              <Button
                                variant={linked ? "secondary" : "primary"}
                                onClick={() =>
                                  void toggleProduct(product.id, linked)
                                }
                                disabled={savingLinkId === product.id}
                              >
                                {savingLinkId === product.id
                                  ? "Saving…"
                                  : linked
                                    ? "Remove"
                                    : "Add to supplier"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {data.products.length === 0 && (
                    <p className="p-4 text-sm text-muted">
                      No products yet. Add a product to get started.
                    </p>
                  )}
                </div>
              </section>
            </div>
          </section>
        </div>
      )}
    </>
  );
}