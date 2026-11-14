"use client";
import { useState } from "react";
import { useApp } from "@/components/app-provider";
import {
  Card,
  PageHeading,
  Badge,
  Button,
  Input,
  Label,
  Select,
} from "@/components/ui";
import { Package, Plus } from "lucide-react";
export default function Products() {
  const { data, addProduct } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [sku, setSku] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!name.trim() || !sku.trim()) return;
    setSaving(true);
    setError("");
    try {
      await addProduct({
        name: name.trim(),
        category: category.trim(),
        sku: sku.trim(),
        supplierIds: supplierId ? [supplierId] : [],
      });
      setName("");
      setCategory("");
      setSku("");
      setSupplierId("");
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add product.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      <PageHeading
        title="Products"
        description="Products supplied by your supplier network."
        action={
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus size={16} /> Add product
          </Button>
        }
      />
      {showForm && (
        <Card className="mb-5">
          <h2 className="mb-3 font-bold">New product</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <Label>Product name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Product name"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category"
              />
            </div>
            <div>
              <Label>SKU *</Label>
              <Input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="SKU-001"
              />
            </div>
            <div>
              <Label>Initial supplier</Label>
              <Select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
              >
                <option value="">No supplier yet</option>
                {data.suppliers
                  .filter((s) => s.status === "active")
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </Select>
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              disabled={saving || !name.trim() || !sku.trim()}
              onClick={() => void submit()}
            >
              {saving ? "Saving…" : "Save product"}
            </Button>
          </div>
        </Card>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.products.map((p) => (
          <Card key={p.id}>
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-brand-soft p-3 text-brand">
                <Package size={21} />
              </div>
              <Badge>{p.sku}</Badge>
            </div>
            <h3 className="mt-4 font-bold">{p.name}</h3>
            <p className="mt-1 text-xs text-muted">{p.category}</p>
            <div className="mt-5 border-t border-line pt-3">
              <div className="mb-2 text-xs font-semibold text-muted">
                SUPPLIED BY
              </div>
              <div className="flex flex-wrap gap-2">
                {data.suppliers
                  .filter((s) => s.products.includes(p.id))
                  .map((s) => (
                    <span
                      key={s.id}
                      className="rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs"
                    >
                      {s.name}
                    </span>
                  ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
