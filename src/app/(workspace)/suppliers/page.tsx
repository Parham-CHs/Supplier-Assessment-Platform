"use client";
import {useState} from "react";
import {useApp} from "@/components/app-provider";
import {Button,Card,Input,PageHeading,Badge,Label} from "@/components/ui";
import {Search,Plus,Package} from "lucide-react";
import {SupplierProductsManager} from "@/features/suppliers/supplier-products-manager";
export default function Suppliers(){
 const {data,addSupplier,mode}=useApp();const [query,setQuery]=useState("");const [showForm,setShowForm]=useState(false);const [name,setName]=useState("");const [contact,setContact]=useState("");const [email,setEmail]=useState("");const [error,setError]=useState("");const [saving,setSaving]=useState(false);
 const rows=data.suppliers.filter(s=>s.name.toLowerCase().includes(query.toLowerCase())||s.email.toLowerCase().includes(query.toLowerCase()));
 const submit=async()=>{if(!name.trim()||!email.trim())return;setSaving(true);setError("");try{await addSupplier({name:name.trim(),contact:contact.trim(),email:email.trim()});setName("");setContact("");setEmail("");setShowForm(false);}catch(e){setError(e instanceof Error?e.message:"Could not add supplier.");}finally{setSaving(false);}};
 return (
  <>
   <PageHeading
	title="Suppliers"
	description="Manage supplier companies and the products they provide."
	action={<Button onClick={() => setShowForm((value) => !value)}><Plus size={16} /> Add supplier</Button>}
   />
   {showForm && (
	<Card className="mb-5">
	 <h2 className="mb-3 font-bold">New supplier</h2>
	 <div className="grid gap-3 sm:grid-cols-3">
	  <div><Label>Company name *</Label><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Supplier company" /></div>
	  <div><Label>Contact person</Label><Input value={contact} onChange={(event) => setContact(event.target.value)} placeholder="Full name" /></div>
	  <div><Label>Email *</Label><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="contact@company.com" /></div>
	 </div>
	 {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
	 <div className="mt-4 flex justify-end gap-2">
	  <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
	  <Button disabled={saving || !name.trim() || !email.trim()} onClick={() => void submit()}>{saving ? "Saving…" : "Save supplier"}</Button>
	 </div>
	</Card>
   )}
   <Card>
	<div className="mb-5 flex items-center justify-between gap-3">
	 <div className="relative w-full max-w-sm"><Search className="absolute left-3 top-3 text-gray-400" size={16} /><Input className="pl-9" placeholder="Search suppliers..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
	 <span className="text-xs text-muted">{rows.length} suppliers</span>
	</div>
	<div className="overflow-x-auto">
	 <table className="w-full min-w-[900px] text-left text-sm">
	  <thead className="text-xs text-muted">
	   <tr>
		<th className="pb-3">Company</th>
		<th className="pb-3">Contact</th>
		<th className="pb-3">Assessments</th>
		<th className="pb-3">Status</th>
		<th className="pb-3">Products</th>
		<th className="pb-3">Manage products</th>
	   </tr>
	  </thead>
	  <tbody>
	   {rows.map((supplier) => (
		<tr key={supplier.id} className="border-t border-line">
		 <td className="py-4"><div className="font-semibold">{supplier.name}</div><div className="mt-1 text-xs text-muted">{supplier.email}</div></td>
		 <td className="py-4">{supplier.contact}</td>
		 <td className="py-4">{data.assignments.filter((assignment) => assignment.supplierId === supplier.id).length}</td>
		 <td className="py-4"><Badge tone={supplier.status === "active" ? "green" : "gray"}>{supplier.status}</Badge></td>
		 <td className="py-4"><span className="inline-flex items-center gap-1 text-muted"><Package size={14} />{supplier.products.length} products</span></td>
		 <td className="py-4"><SupplierProductsManager supplier={supplier} /></td>
		</tr>
	   ))}
	   {rows.length === 0 && (
		<tr><td colSpan={6} className="py-10 text-center text-sm text-muted">No suppliers found.</td></tr>
	   )}
	  </tbody>
	 </table>
	</div>
   </Card>
   <p className="mt-3 text-xs text-muted">{mode === "demo" ? "Demo records are stored in this browser." : "Supplier records are stored in your Supabase organization."} Supplier user accounts must be created in Supabase Auth and linked through a profiles row (see supabase/SETUP.md).</p>
  </>
 );
}
