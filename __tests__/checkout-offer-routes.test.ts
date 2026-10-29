import {expect,it} from 'vitest'
import {POST} from '../src/app/api/stripe/checkout/route'
import {POST as founder} from '../src/app/api/stripe/checkout-founder/route'
it('retires all old recurring and founder purchase entry points',async()=>{expect((await POST()).status).toBe(410);expect((await founder()).status).toBe(410)})
