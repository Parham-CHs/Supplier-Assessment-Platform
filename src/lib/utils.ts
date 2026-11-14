import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs:ClassValue[]){return twMerge(clsx(inputs));}
export function formatDate(value:string){return new Intl.DateTimeFormat("en",{month:"short",day:"numeric",year:"numeric"}).format(new Date(value+ (value.length===10?"T12:00:00":"")));}
export function initials(value:string){return value.split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase();}
