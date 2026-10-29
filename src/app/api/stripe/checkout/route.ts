import {NextResponse} from 'next/server'
/** Retired recurring offers cannot create purchases from stale clients. */
export async function POST(){return NextResponse.json({error:'This offer has been replaced by the one-time Retake Pass. Open /checkout.'},{status:410})}
