import type { AppData } from "./types";
const today = new Date();
const plus = (n:number) => { const d=new Date(today); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); };
export const seedData: AppData = {
 suppliers:[
  {id:"sup-samsung",name:"Samsung Electronics",contact:"Minji Park",email:"minji@samsung.example",status:"active",products:["prod-fridge","prod-washer"]},
  {id:"sup-lg",name:"LG Electronics",contact:"Daniel Kim",email:"daniel@lg.example",status:"active",products:["prod-fridge","prod-tv"]},
  {id:"sup-bosch",name:"Bosch Home",contact:"Anna Weber",email:"anna@bosch.example",status:"active",products:["prod-dishwasher","prod-vacuum"]},
  {id:"sup-whirlpool",name:"Whirlpool",contact:"James Miller",email:"james@whirlpool.example",status:"inactive",products:["prod-washer"]}
 ],
 products:[
  {id:"prod-fridge",name:"Smart Refrigerator",category:"Kitchen appliances",sku:"KIT-FR-001"},
  {id:"prod-washer",name:"Front Load Washing Machine",category:"Laundry",sku:"LAU-WM-014"},
  {id:"prod-tv",name:"OLED Television",category:"Electronics",sku:"EL-TV-009"},
  {id:"prod-dishwasher",name:"Eco Dishwasher",category:"Kitchen appliances",sku:"KIT-DW-021"},
  {id:"prod-vacuum",name:"Cordless Vacuum",category:"Cleaning",sku:"CL-VAC-003"}
 ],
 questionnaires:[
  {id:"q-safety",title:"Product Safety Assessment",description:"Evaluate certifications, safety processes and product compliance.",status:"published",version:1,updatedAt:today.toISOString(),questions:[
   {id:"q1",title:"Does this product have a valid safety certification?",description:"Include nationally or internationally recognized certifications.",type:"yes_no",required:true,options:[],position:1},
   {id:"q2",title:"Which certification does the product hold?",type:"multiple_choice",required:true,options:["CE","ISO 9001","UL","Energy Star","Other"],position:2,condition:{dependsOn:"q1",operator:"equals",value:"yes"}},
   {id:"q3",title:"Upload the current certificate",type:"file",required:true,options:[],position:3,condition:{dependsOn:"q1",operator:"equals",value:"yes"}},
   {id:"q4",title:"Why does the product not have a safety certification?",type:"long_text",required:true,options:[],position:4,condition:{dependsOn:"q1",operator:"equals",value:"no"}},
   {id:"q5",title:"When was the product last safety-tested?",type:"date",required:true,options:[],position:5},
   {id:"q6",title:"Rate your quality-control process",type:"rating",required:true,options:[],position:6}
  ]},
  {id:"q-quality",title:"Supplier Quality Review",description:"A short review of manufacturing and quality-control practices.",status:"published",version:1,updatedAt:today.toISOString(),questions:[
   {id:"qq1",title:"How many units can you produce per month?",type:"number",required:true,options:[],position:1},
   {id:"qq2",title:"Describe your quality assurance process",type:"long_text",required:true,options:[],position:2},
   {id:"qq3",title:"Do you perform third-party inspections?",type:"yes_no",required:true,options:[],position:3},
   {id:"qq4",title:"Which inspection body do you use?",type:"short_text",required:false,options:[],position:4,condition:{dependsOn:"qq3",operator:"equals",value:"yes"}}
  ]}
 ],
 assignments:[
  {id:"as-1001",questionnaireId:"q-safety",questionnaireTitle:"Product Safety Assessment",supplierId:"sup-samsung",supplierName:"Samsung Electronics",productId:"prod-fridge",productName:"Smart Refrigerator",deadline:plus(5),status:"submitted",createdAt:plus(-8),response:{q1:"yes",q2:["CE","ISO 9001"],q5:plus(-20),q6:5}},
  {id:"as-1002",questionnaireId:"q-safety",questionnaireTitle:"Product Safety Assessment",supplierId:"sup-lg",supplierName:"LG Electronics",productId:"prod-tv",productName:"OLED Television",deadline:plus(3),status:"in_progress",createdAt:plus(-3),response:{q1:"no",q4:"Certification review is in progress."}},
  {id:"as-1003",questionnaireId:"q-quality",questionnaireTitle:"Supplier Quality Review",supplierId:"sup-bosch",supplierName:"Bosch Home",productId:"prod-dishwasher",productName:"Eco Dishwasher",deadline:plus(-2),status:"overdue",createdAt:plus(-10)},
  {id:"as-1004",questionnaireId:"q-safety",questionnaireTitle:"Product Safety Assessment",supplierId:"sup-bosch",supplierName:"Bosch Home",productId:"prod-vacuum",productName:"Cordless Vacuum",deadline:plus(7),status:"pending",createdAt:plus(-1)},
  {id:"as-1005",questionnaireId:"q-quality",questionnaireTitle:"Supplier Quality Review",supplierId:"sup-samsung",supplierName:"Samsung Electronics",productId:"prod-washer",productName:"Front Load Washing Machine",deadline:plus(4),status:"submitted",createdAt:plus(-6),response:{qq1:12000,qq2:"Multi-stage quality inspections",qq3:"yes",qq4:"TUV"}},
  {id:"as-1006",questionnaireId:"q-safety",questionnaireTitle:"Product Safety Assessment",supplierId:"sup-lg",supplierName:"LG Electronics",productId:"prod-fridge",productName:"Smart Refrigerator",deadline:plus(1),status:"pending",createdAt:plus(-1)}
 ],
 notifications:[
  {id:"n1",title:"New questionnaire assigned",message:"Product Safety Assessment was assigned to your company.",createdAt:today.toISOString(),read:false,assignmentId:"as-1002"},
  {id:"n2",title:"Deadline approaching",message:"Supplier Quality Review is due soon.",createdAt:today.toISOString(),read:false,assignmentId:"as-1005"}
 ]
};
