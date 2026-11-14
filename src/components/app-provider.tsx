"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { seedData } from "@/lib/seed";
import type { AppData, Assignment, Notification, Question, Questionnaire, Role } from "@/lib/types";
type ContextValue={data:AppData;role:Role;setRole:(r:Role)=>void;userName:string;addQuestionnaire:(q:Questionnaire)=>void;updateQuestionnaire:(q:Questionnaire)=>void;createAssignment:(input:{questionnaire:Questionnaire;supplierIds:string[];productIds:string[];deadline:string})=>void;saveResponse:(id:string,answers:Record<string,unknown>,submit:boolean)=>void;markNotificationRead:(id:string)=>void;resetDemo:()=>void;mode:"demo"|"supabase"};
const Ctx=createContext<ContextValue|null>(null);
export function AppProvider({children}:{children:React.ReactNode}){
 const [data,setData]=useState<AppData>(seedData); const [role,setRole]=useState<Role>("org_admin"); const [ready,setReady]=useState(false);
 useEffect(()=>{try{const raw=localStorage.getItem("supplys-snapshot-v1");if(raw)setData(JSON.parse(raw) as AppData);const savedRole=localStorage.getItem("supplys-role") as Role|null;if(savedRole)setRole(savedRole);}catch{}setReady(true);},[]);
 useEffect(()=>{if(ready){localStorage.setItem("supplys-snapshot-v1",JSON.stringify(data));localStorage.setItem("supplys-role",role);}},[data,role,ready]);
 const value=useMemo<ContextValue>(()=>({data,role,setRole,userName:role==="supplier_user"?"Minji Park":role==="org_manager"?"Alex Morgan":"Olivia Chen",mode:"demo",
 addQuestionnaire:(q)=>setData(d=>({...d,questionnaires:[q,...d.questionnaires]})),
 updateQuestionnaire:(q)=>setData(d=>({...d,questionnaires:d.questionnaires.map(x=>x.id===q.id?q:x)})),
 createAssignment:({questionnaire,supplierIds,productIds,deadline})=>setData(d=>{const rows:Assignment[]=[];supplierIds.forEach(sid=>{const s=d.suppliers.find(x=>x.id===sid);if(!s)return;productIds.filter(pid=>s.products.includes(pid)).forEach(pid=>{const p=d.products.find(x=>x.id===pid);if(!p)return;rows.push({id:crypto.randomUUID(),questionnaireId:questionnaire.id,questionnaireTitle:questionnaire.title,supplierId:s.id,supplierName:s.name,productId:p.id,productName:p.name,deadline,status:"pending",createdAt:new Date().toISOString()});});});const notices:Notification[]=rows.map(a=>({id:crypto.randomUUID(),title:"New questionnaire assigned",message:`${a.questionnaireTitle} was assigned for ${a.productName}.`,createdAt:new Date().toISOString(),read:false,assignmentId:a.id}));return {...d,assignments:[...rows,...d.assignments],notifications:[...notices,...d.notifications]};}),
 saveResponse:(id,answers,submit)=>setData(d=>({...d,assignments:d.assignments.map(a=>a.id===id?{...a,response:answers,status:submit?"submitted":"in_progress"}:a)})),
 markNotificationRead:(id)=>setData(d=>({...d,notifications:d.notifications.map(n=>n.id===id?{...n,read:true}:n)})),
 resetDemo:()=>setData(seedData)
 }),[data,role]);
 return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useApp(){const value=useContext(Ctx);if(!value)throw new Error("useApp must be used inside AppProvider");return value;}
