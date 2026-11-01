import test from 'node:test';
import assert from 'node:assert/strict';
import {calculate,defaults,quote,plan,defaultProfile,seed,mutate} from '../lib/domain.ts';
test('all supplied sale scenarios and break-even match the presentation',()=>{
 const r=calculate(defaults);assert.equal(r.now,45800);assert.equal(r.quantity,19.6);
 assert.deepEqual(r.scenarios.map(s=>Math.round(s.net)),[44320,48240,51180]);
 assert.deepEqual(r.scenarios.map(s=>Math.round(s.difference)),[-1480,2440,5380]);
 assert.ok(Math.abs(r.breakEven-2525.510204)<.000001);assert.equal(Math.ceil(r.breakEven),2526);
});
test('sale costs counted once and fees reduce appropriate scenario',()=>{
 const base=calculate(defaults),r=calculate({...defaults,handling:100,nowFee:50,futureFee:200});
 assert.equal(r.now,base.now-50);assert.equal(r.cost,base.cost+300);assert.equal(r.scenarios[1].net,base.scenarios[1].net-300);
});
test('invalid and missing calculator inputs produce understandable errors',()=>{
 for(const quantity of [0,-1,NaN,Infinity,'',null])assert.throws(()=>calculate({...defaults,quantity}));
 assert.throws(()=>calculate({...defaults,deterioration:100}),/No produce remains/);
 assert.throws(()=>calculate({...defaults,deterioration:101}));
 assert.throws(()=>calculate({...defaults,storage:-1}));
 assert.equal(calculate({...defaults,nowPrice:0}).increase,null);
 assert.ok(calculate({...defaults,nowTransport:1000000}).now<0);
});
test('crop suitability responds to water, season, budget and missing inputs',()=>{
 assert.equal(plan(defaultProfile).options[0].crop,'Wheat');
 const low=plan({...defaultProfile,water:'Limited',irrigation:'Unavailable'});assert.notEqual(low.options[0].crop,'Wheat');
 const kh=plan({...defaultProfile,season:'Kharif'});assert.ok(kh.options.some(c=>c.crop==='Rice'));assert.ok(!kh.options.some(c=>c.crop==='Wheat'));
 assert.ok(plan({...defaultProfile,soil:'unknown'}).options.every(c=>c.fit==='More information needed'));
 assert.throws(()=>plan({...defaultProfile,district:''}));
 assert.deepEqual(plan({...defaultProfile,area:1,unit:'hectares'}).options.find(c=>c.crop==='Wheat').totalCost,[44479,61776]);
});
test('storage suitability, itemized quote and invalid durations',()=>{
 assert.deepEqual(quote({facility:'grain',crop:'Wheat',quantity:20,duration:35}),{facility:'Karnal Grain Centre',storage:2100,handling:300,transport:1300,total:3700});
 assert.throws(()=>quote({facility:'cold',crop:'Wheat',quantity:20,duration:35}),/not suitable/);
 assert.throws(()=>quote({facility:'grain',crop:'Wheat',quantity:0,duration:35}));
 assert.throws(()=>quote({facility:'grain',crop:'Wheat',quantity:20,duration:1.5}));
});
test('bid reserve, closing time, listing lock and acceptance enforced server-side',()=>{
 const s=seed();assert.throws(()=>mutate(s,{type:'bid',payload:{listingId:'lot-wheat',price:2349,transport:0,buyer:'Test'}}));
 const next=mutate(s,{type:'bid',payload:{listingId:'lot-wheat',price:2500,transport:100,buyer:'Test'}});assert.equal(next.listings[0].bids.length,3);assert.equal(s.listings[0].bids.length,2);
 assert.throws(()=>mutate(next,{type:'listing',payload:{...next.listings[0]}}),/cannot be edited/);
 const accepted=mutate(next,{type:'acceptBid',payload:{listingId:'lot-wheat',bidId:'bid-2'}});assert.equal(accepted.listings[0].status,'accepted');
 assert.throws(()=>mutate(accepted,{type:'bid',payload:{listingId:'lot-wheat',price:2600,transport:0,buyer:'Test'}}),/closed/);
 const expired=seed();expired.listings[0].closes='2020-01-01T00:00:00Z';assert.throws(()=>mutate(expired,{type:'acceptBid',payload:{listingId:'lot-wheat',bidId:'bid-1'}}),/no longer open/);
});
test('new listings, edit before bids and explicit booking progress',()=>{
 let s=seed();s=mutate(s,{type:'listing',payload:{crop:'Potato',variety:'Kufri',quantity:10,reserve:1800,grade:'Farmer grade',location:'Karnal',harvest:'2026-04-15',closes:new Date(Date.now()+86400000).toISOString(),quality:'Farmer description'}});const lot=s.listings[0];assert.equal(lot.crop,'Potato');
 s=mutate(s,{type:'listing',payload:{...lot,quantity:12}});assert.equal(s.listings[0].quantity,12);
 s=mutate(s,{type:'booking',payload:{facility:'cold',crop:'Potato',quantity:12,duration:30,pickup:'Karnal',start:new Date().toISOString().slice(0,10)}});assert.equal(s.bookings[0].status,0);
 for(let i=1;i<=4;i++){s=mutate(s,{type:'advanceBooking',payload:{id:s.bookings[0].id}});assert.equal(s.bookings[0].status,i);}
 assert.throws(()=>mutate(s,{type:'advanceBooking',payload:{id:s.bookings[0].id}}));
 const reset=mutate(s,{type:'reset',payload:{}});assert.equal(reset.bookings.length,0);assert.equal(reset.listings.length,1);assert.equal(reset.profile.name,'Meera Devi');
});
