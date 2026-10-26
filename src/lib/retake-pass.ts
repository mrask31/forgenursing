/** Locked offer. Wiring into Checkout and server-owned entitlements is a release gate. */
export const RETAKE_PASS = { amount:2999, currency:'usd', months:3, freeExtensions:1 } as const
export function addCalendarMonthsUTC(value:string, months:number):string {
 const date = new Date(value)
 if (!Number.isFinite(date.getTime()) || !Number.isInteger(months) || months<0) throw new Error('Invalid pass date')
 const day = date.getUTCDate()
 date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth()+months)
 const last = new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate()
 date.setUTCDate(Math.min(day,last))
 return date.toISOString()
}
export function retakePassState(pass:{purchasedAt:string;accessUntil:string;extendedAt:string|null},now=Date.now()) {
 const until = new Date(pass.accessUntil).getTime()
 const originalEnd = new Date(addCalendarMonthsUTC(pass.purchasedAt,3)).getTime()
 return {active:Number.isFinite(until)&&until>now,extensionAvailable:!pass.extendedAt&&now>=originalEnd,extensionUsed:Boolean(pass.extendedAt)}
}
export function matchesRetakePassPrice(price:{active:boolean;currency:string;unit_amount:number|null;type:string;recurring:unknown}):boolean {
 return price.active&&price.currency===RETAKE_PASS.currency&&price.unit_amount===RETAKE_PASS.amount&&price.type==='one_time'&&price.recurring===null
}
