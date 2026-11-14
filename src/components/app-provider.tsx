"use client";
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { seedData } from "@/lib/seed";
import type { AppData, Assignment, Notification, Question, Questionnaire, Role } from "@/lib/types";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

type Mode="demo"|"supabase";
type ContextValue={data:AppData;role:Role;setRole:(r:Role)=>void;userName:string;userEmail:string;supplierId:string|null;loading:boolean;error:string;mode:Mode;signOut:()=>Promise<void>;addSupplier:(input:{name:string;contact:string;email:string})=>Promise<void>;addProduct:(input:{name:string;category:string;sku:string;supplierIds:string[]})=>Promise<void>;addQuestionnaire:(q:Questionnaire)=>Promise<void>;updateQuestionnaire:(q:Questionnaire)=>Promise<void>;createAssignment:(input:{questionnaire:Questionnaire;supplierIds:string[];productIds:string[];deadline:string})=>Promise<void>;saveResponse:(id:string,answers:Record<string,unknown>,submit:boolean)=>Promise<void>;markNotificationRead:(id:string)=>Promise<void>;resetDemo:()=>void};
const Ctx=createContext<ContextValue|null>(null);
const emptyData:AppData={suppliers:[],products:[],questionnaires:[],assignments:[],notifications:[]};

async function loadWorkspace(supabase:any, role:Role):Promise<AppData>{
  const [suppliersRes,productsRes,questionnairesRes,assignmentsRes,notificationsRes]=await Promise.all([
    supabase.from("suppliers").select("id,name,contact_name,email,status,supplier_products(product_id)").order("name"),
    supabase.from("products").select("id,name,category,sku").order("name"),
    supabase.from("questionnaires").select("id,title,description,status,current_version,updated_at,questionnaire_versions(id,version,published_at,questions(id,title,description,question_type,required,options,condition,position))").order("updated_at",{ascending:false}),
    supabase.from("assignments").select("id,questionnaire_version_id,supplier_id,product_id,deadline,status,created_at,suppliers(name),products(name),questionnaire_versions(id,version,questionnaire_id,questionnaires(title),questions(id,title,description,question_type,required,options,condition,position)),responses(id,status,submitted_at,answers(question_id,value))").order("created_at",{ascending:false}),
    supabase.from("notifications").select("id,title,message,created_at,read_at,assignment_id").order("created_at",{ascending:false}),
  ]);
  for(const r of [suppliersRes,productsRes,questionnairesRes,assignmentsRes,notificationsRes]) if(r.error) throw r.error;
  const products=productsRes.data??[];
  const suppliers=(suppliersRes.data??[]).map((s:any)=>({id:s.id,name:s.name,contact:s.contact_name??"",email:s.email??"",status:s.status,products:(s.supplier_products??[]).map((x:any)=>x.product_id)}));
  const questionnaires=(questionnairesRes.data??[]).map((q:any)=>{
    const version=(q.questionnaire_versions??[]).find((v:any)=>v.version===q.current_version)??q.questionnaire_versions?.[0];
    const questions=(version?.questions??[]).sort((a:any,b:any)=>a.position-b.position).map((x:any):Question=>({id:x.id,title:x.title,description:x.description??undefined,type:x.question_type,required:x.required,options:x.options??[],position:x.position,condition:x.condition??undefined}));
    return {id:q.id,title:q.title,description:q.description??"",status:q.status,version:q.current_version,questions,updatedAt:q.updated_at};
  });
  const assignments=(assignmentsRes.data??[]).map((a:any):Assignment=>{
    const version=a.questionnaire_versions; const response=Array.isArray(a.responses)?a.responses[0]:a.responses;
    const answers:Record<string,unknown>={}; (response?.answers??[]).forEach((answer:any)=>answers[answer.question_id]=answer.value);
    const versionQuestions=(version?.questions??[]).sort((x:any,y:any)=>x.position-y.position).map((x:any):Question=>({id:x.id,title:x.title,description:x.description??undefined,type:x.question_type,required:x.required,options:x.options??[],position:x.position,condition:x.condition??undefined}));
    return {id:a.id,questionnaireId:version?.questionnaire_id??"",questionnaireTitle:version?.questionnaires?.title??"Questionnaire",questionnaireVersion:version?.version,questions:versionQuestions,supplierId:a.supplier_id,supplierName:a.suppliers?.name??"Supplier",productId:a.product_id,productName:a.products?.name??"Product",deadline:a.deadline,status:a.status,createdAt:a.created_at,...(response?{response:answers}:{})};
  });
  const notifications=(notificationsRes.data??[]).map((n:any):Notification=>({id:n.id,title:n.title,message:n.message,createdAt:n.created_at,read:Boolean(n.read_at),assignmentId:n.assignment_id??undefined}));
  return {suppliers,products:products.map((p:any)=>({id:p.id,name:p.name,category:p.category??"",sku:p.sku??""})),questionnaires,assignments,notifications};
}

export function AppProvider({children}:{children:React.ReactNode}){
 const router=useRouter(); const configured=isSupabaseConfigured();
 const [data,setData]=useState<AppData>(configured?emptyData:seedData); const [role,setRoleState]=useState<Role>("org_admin");
 const [userName,setUserName]=useState("Demo User"); const [userEmail,setUserEmail]=useState("");
 const [loading,setLoading]=useState(configured); const [error,setError]=useState(""); const [userId,setUserId]=useState<string|null>(null); const [supplierId,setSupplierId]=useState<string|null>(null);
 const supabase=getSupabaseBrowserClient();
 const refresh=useCallback(async()=>{
   if(!supabase)return;
   setLoading(true);setError("");
   try{
     const {data:{user},error:authError}=await supabase.auth.getUser(); if(authError)throw authError;
     if(!user){setUserId(null);setSupplierId(null);setLoading(false);return;}
     const {data:profile,error:profileError}=await supabase.from("profiles").select("id,role,full_name,supplier_id").eq("id",user.id).single();
     if(profileError)throw profileError;
     setUserId(user.id);setSupplierId(profile.supplier_id??null);setRoleState(profile.role);setUserName(profile.full_name);setUserEmail(user.email??"");
     setData(await loadWorkspace(supabase,profile.role));
   }catch(e){setError(e instanceof Error?e.message:"Could not load workspace data.");}
   finally{setLoading(false);}
 },[supabase]);
 useEffect(()=>{
   if(!configured){try{const raw=localStorage.getItem("supplys-snapshot-v1");if(raw)setData(JSON.parse(raw) as AppData);const savedRole=localStorage.getItem("supplys-role") as Role|null;if(savedRole)setRoleState(savedRole);}catch{}setLoading(false);return;}
   void refresh();
   const {data:{subscription}}=supabase!.auth.onAuthStateChange(()=>{setTimeout(()=>void refresh(),0);});
   return ()=>subscription.unsubscribe();
 },[configured,refresh,supabase]);
 useEffect(()=>{if(!configured&&!loading){localStorage.setItem("supplys-snapshot-v1",JSON.stringify(data));localStorage.setItem("supplys-role",role);}},[data,role,loading,configured]);
 const setRole=(next:Role)=>{if(!configured){setRoleState(next);setUserName(next==="supplier_user"?"Minji Park":next==="org_manager"?"Alex Morgan":"Olivia Chen");}};
 const signOut=async()=>{if(supabase)await supabase.auth.signOut();setUserId(null);setSupplierId(null);router.replace("/login");router.refresh();};
 const addSupplier=async(input:{name:string;contact:string;email:string})=>{
   if(!supabase){const id=crypto.randomUUID();setData(d=>({...d,suppliers:[{id,name:input.name,contact:input.contact,email:input.email,status:"active",products:[]},...d.suppliers]}));return;}
   const {data:profile,error:pe}=await supabase.from("profiles").select("organization_id").eq("id",userId).single();if(pe)throw pe;
   const {error:e}=await supabase.from("suppliers").insert({organization_id:profile.organization_id,name:input.name,contact_name:input.contact,email:input.email,status:"active"});if(e)throw e;await refresh();
 };
 const addProduct=async(input:{name:string;category:string;sku:string;supplierIds:string[]})=>{
   if(!supabase){const id=crypto.randomUUID();setData(d=>({...d,products:[{id,name:input.name,category:input.category,sku:input.sku},...d.products],suppliers:d.suppliers.map(s=>input.supplierIds.includes(s.id)?{...s,products:[...s.products,id]}:s)}));return;}
   const {data:profile,error:pe}=await supabase.from("profiles").select("organization_id").eq("id",userId).single();if(pe)throw pe;
   const {data:product,error:e}=await supabase.from("products").insert({organization_id:profile.organization_id,name:input.name,category:input.category,sku:input.sku}).select("id").single();if(e)throw e;
   if(input.supplierIds.length){const {error:linkError}=await supabase.from("supplier_products").insert(input.supplierIds.map(supplier_id=>({supplier_id,product_id:product.id})));if(linkError)throw linkError;}await refresh();
 };
 const addQuestionnaire=async(q:Questionnaire)=>{
   if(!supabase){setData(d=>({...d,questionnaires:[q,...d.questionnaires]}));return;}
   const {data:auth}=await supabase.auth.getUser(); if(!auth.user)throw new Error("Sign in required.");
   const {data:created,error:e}=await supabase.from("questionnaires").insert({organization_id:(await supabase.from("profiles").select("organization_id").eq("id",auth.user.id).single()).data?.organization_id,title:q.title,description:q.description,status:q.status,current_version:1,created_by:auth.user.id}).select("id").single(); if(e)throw e;
   const {data:version,error:ve}=await supabase.from("questionnaire_versions").insert({questionnaire_id:created.id,version:1,published_at:null}).select("id").single();if(ve)throw ve;
   if(q.questions.length){const {error:qe}=await supabase.from("questions").insert(q.questions.map(x=>({id:x.id,questionnaire_version_id:version.id,title:x.title,description:x.description??null,question_type:x.type,required:x.required,options:x.options,condition:x.condition??null,position:x.position})));if(qe)throw qe;}
   if(q.status==="published"){const {error:publishError}=await supabase.from("questionnaire_versions").update({published_at:new Date().toISOString()}).eq("id",version.id);if(publishError)throw publishError;}
   await refresh();
 };
 const updateQuestionnaire=async(q:Questionnaire)=>{
   if(!supabase){setData(d=>({...d,questionnaires:d.questionnaires.map(x=>x.id===q.id?q:x)}));return;}
   const existing=data.questionnaires.find(x=>x.id===q.id); if(!existing)throw new Error("Questionnaire not found.");
   const nextVersion=existing.status==="published"?existing.version+1:existing.version;
   const {error:e}=await supabase.from("questionnaires").update({title:q.title,description:q.description,status:q.status,current_version:nextVersion,updated_at:new Date().toISOString()}).eq("id",q.id);if(e)throw e;
   let versionId:string;
   if(existing.status==="published"){
     const {data:v,error:ve}=await supabase.from("questionnaire_versions").insert({questionnaire_id:q.id,version:nextVersion,published_at:null}).select("id").single();if(ve)throw ve;versionId=v.id;
   }else{
     const {data:v,error:ve}=await supabase.from("questionnaire_versions").select("id").eq("questionnaire_id",q.id).eq("version",existing.version).single();if(ve)throw ve;versionId=v.id;
     const {error:de}=await supabase.from("questions").delete().eq("questionnaire_version_id",versionId);if(de)throw de;
   }
   if(q.questions.length){
     const idMap=new Map<string,string>();
     if(existing.status==="published")q.questions.forEach(x=>idMap.set(x.id,crypto.randomUUID()));
     const questionRows=q.questions.map(x=>({id:idMap.get(x.id)??x.id,questionnaire_version_id:versionId,title:x.title,description:x.description??null,question_type:x.type,required:x.required,options:x.options,condition:x.condition?{...x.condition,dependsOn:idMap.get(x.condition.dependsOn)??x.condition.dependsOn}:null,position:x.position}));
     const {error:qe}=await supabase.from("questions").insert(questionRows);if(qe)throw qe;
   }
   if(q.status==="published"){const {error:publishError}=await supabase.from("questionnaire_versions").update({published_at:new Date().toISOString()}).eq("id",versionId);if(publishError)throw publishError;}
   await refresh();
 };
 const createAssignment=async({questionnaire,supplierIds,productIds,deadline}:{questionnaire:Questionnaire;supplierIds:string[];productIds:string[];deadline:string})=>{
   if(!supabase){setData(d=>{const rows:Assignment[]=[];supplierIds.forEach(sid=>{const s=d.suppliers.find(x=>x.id===sid);if(!s)return;productIds.filter(pid=>s.products.includes(pid)).forEach(pid=>{const p=d.products.find(x=>x.id===pid);if(p)rows.push({id:crypto.randomUUID(),questionnaireId:questionnaire.id,questionnaireTitle:questionnaire.title,supplierId:s.id,supplierName:s.name,productId:p.id,productName:p.name,deadline,status:"pending",createdAt:new Date().toISOString()});});});return {...d,assignments:[...rows,...d.assignments]};});return;}
   const {data:v,error:ve}=await supabase.from("questionnaire_versions").select("id").eq("questionnaire_id",questionnaire.id).eq("version",questionnaire.version).single();if(ve)throw ve;
   const rows:any[]=[];for(const sid of supplierIds){const supplier=data.suppliers.find(s=>s.id===sid);if(!supplier)continue;for(const pid of productIds.filter(id=>supplier.products.includes(id)))rows.push({questionnaire_version_id:v.id,supplier_id:sid,product_id:pid,deadline,created_by:userId});}
   if(!rows.length)throw new Error("No selected supplier/product combinations are linked.");
   const {data:created,error:e}=await supabase.from("assignments").insert(rows).select("id,supplier_id,product_id");if(e)throw e;
   for(const assignment of created??[]){const recipients=await supabase.from("profiles").select("id").eq("supplier_id",assignment.supplier_id).eq("role","supplier_user");if(recipients.data?.length){const supplier=data.suppliers.find(s=>s.id===assignment.supplier_id);const product=data.products.find(p=>p.id===assignment.product_id);const {error:notificationError}=await supabase.from("notifications").insert(recipients.data.map((u:any)=>({recipient_user_id:u.id,assignment_id:assignment.id,title:"New questionnaire assigned",message:`${questionnaire.title} was assigned for ${product?.name??"your product"}.` })));if(notificationError)throw notificationError;}}
   await refresh();
 };
 const saveResponse=async(id:string,answers:Record<string,unknown>,submit:boolean)=>{
   if(!supabase){setData(d=>({...d,assignments:d.assignments.map(a=>a.id===id?{...a,response:answers,status:submit?"submitted":"in_progress"}:a)}));return;}
   if(!userId)throw new Error("Sign in required.");
   const {data:response,error:e}=await supabase.from("responses").upsert({assignment_id:id,submitted_by:userId,status:"draft",submitted_at:null,updated_at:new Date().toISOString()},{onConflict:"assignment_id"}).select("id").single();if(e)throw e;
   const assignment=data.assignments.find(a=>a.id===id);if(!assignment)throw new Error("Assignment not found.");
   const applicableQuestions=assignment.questions??data.questionnaires.find(q=>q.id===assignment.questionnaireId)?.questions??[];
   const allowedIds=new Set(applicableQuestions.map(q=>q.id));
   const answerRows=Object.entries(answers).filter(([questionId,value])=>allowedIds.has(questionId)&&value!==undefined&&value!==null&&value!=="").map(([question_id,value])=>({response_id:response.id,question_id,value}));
   const {error:deleteError}=await supabase.from("answers").delete().eq("response_id",response.id);if(deleteError)throw deleteError;
   if(answerRows.length){const {error:answerError}=await supabase.from("answers").insert(answerRows);if(answerError)throw answerError;}
   if(submit){const {error:submitError}=await supabase.from("responses").update({status:"submitted",submitted_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",response.id);if(submitError)throw submitError;}
   const {error:assignmentError}=await supabase.from("assignments").update({status:submit?"submitted":"in_progress"}).eq("id",id);if(assignmentError)throw assignmentError;
   await refresh();
 };
 const markNotificationRead=async(id:string)=>{if(!supabase){setData(d=>({...d,notifications:d.notifications.map(n=>n.id===id?{...n,read:true}:n)}));return;}const {error:e}=await supabase.from("notifications").update({read_at:new Date().toISOString()}).eq("id",id);if(e)throw e;await refresh();};
 const resetDemo=()=>{if(!configured)setData(seedData);};
 const value=useMemo<ContextValue>(()=>({data,role,setRole,userName,userEmail,supplierId,loading,error,mode:configured?"supabase":"demo",signOut,addSupplier,addProduct,addQuestionnaire,updateQuestionnaire,createAssignment,saveResponse,markNotificationRead,resetDemo}),[data,role,userName,userEmail,supplierId,loading,error,configured,signOut,addSupplier,addProduct,addQuestionnaire,updateQuestionnaire,createAssignment,saveResponse,markNotificationRead]);
 return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useApp(){const value=useContext(Ctx);if(!value)throw new Error("useApp must be used inside AppProvider");return value;}
