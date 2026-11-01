export type Profile = { name:string; language:string; district:string; state:string; area:number; unit:string; season:string; soil:string; ph:string; irrigation:string; water:string; budget:number; previousCrop:string; preference:string; configured:boolean };
export type Bid = { id:string; buyer:string; price:number; transport:number; fee:number; at:string };
export type Listing = { id:string; crop:string; variety:string; quantity:number; grade:string; location:string; harvest:string; reserve:number; closes:string; quality:string; image:string; status:string; bids:Bid[]; acceptedBid?:string; };
export type CalculatorInput = { quantity:number; nowPrice:number; nowTransport:number; deterioration:number; futureTransport:number; storage:number; handling:number; nowFee:number; futureFee:number; conservative:number; expected:number; optimistic:number; };
export type Booking = { id:string; facility:string; crop:string; quantity:number; duration:number; pickup:string; start:string; total:number; storage:number; handling:number; transport:number; status:number; createdAt:string; };
export type Workspace = { profile:Profile; listings:Listing[]; comparisons:{id:string; input:CalculatorInput; createdAt:string}[]; bookings:Booking[]; interests:{id:string; item:string; quantity:number; date:string; at:string}[]; enquiries:{id:string; kind:string; message:string; at:string}[]; tasks:string[]; revision?:number; };
export const defaults:CalculatorInput = {quantity:20,nowPrice:2350,nowTransport:1200,deterioration:2,futureTransport:1300,storage:2400,handling:0,nowFee:0,futureFee:0,conservative:2450,expected:2650,optimistic:2800};
export const defaultProfile:Profile = {name:'Meera Devi',language:'en',district:'Karnal',state:'Haryana',area:2,unit:'acres',season:'Rabi',soil:'Loam',ph:'unknown',irrigation:'Available',water:'Adequate',budget:50000,previousCrop:'Rice',preference:'Wheat',configured:false};
export function number(value:unknown,label:string,min=0,max=100000000) {
 if(value === '' || value === null || value === undefined || typeof value === 'boolean') throw new Error(`${label} is required.`);
 const n=Number(value); if(!Number.isFinite(n)||n<min||n>max) throw new Error(`${label} must be between ${min} and ${max}.`); return n;
}
export function clean(value:unknown,label:string,max=160) { if(typeof value!=='string'||!value.trim()||value.trim().length>max) throw new Error(`${label} is required (up to ${max} characters).`); return value.trim(); }
export function calculate(raw:CalculatorInput) {
 const v={} as CalculatorInput;
 for(const key of Object.keys(defaults) as (keyof CalculatorInput)[]) v[key]=number(raw[key],key,key==='quantity'?0.01:0,key==='deterioration'?100:100000000);
 if(v.deterioration>=100) throw new Error('No produce remains to sell at 100% deterioration. Enter a value below 100%.');
 const quantity=v.quantity*(1-v.deterioration/100), now=v.quantity*v.nowPrice-v.nowTransport-v.nowFee;
 const cost=v.futureTransport+v.storage+v.handling+v.futureFee;
 const scenarios=['conservative','expected','optimistic'].map(key=>{const price=v[key as keyof CalculatorInput];const gross=quantity*price;const net=gross-cost;return {key,price,gross,net,difference:net-now};});
 const breakEven=(now+cost)/quantity;
 return {input:v,quantity,now,nowGross:v.quantity*v.nowPrice,cost,scenarios,breakEven,increase:v.nowPrice>0?(breakEven/v.nowPrice-1)*100:null};
}
export const facilities = [
 {id:'grain',name:'Karnal Grain Centre',type:'Dry warehouse',crops:['Wheat','Mustard','Chickpea','Rice','Millet','Maize'],distance:12,rate:3,handling:300,transport:1300,capacity:'120 quintals',note:'Dry, cleaned grain only. Moisture testing required.'},
 {id:'rural',name:'Sahaj Rural Warehouse',type:'Dry warehouse',crops:['Wheat','Mustard','Chickpea','Rice','Millet','Maize'],distance:24,rate:2.6,handling:400,transport:1700,capacity:'80 quintals',note:'Ventilated grain storage. Bagging required.'},
 {id:'cold',name:'Green Valley Cold Store',type:'Cold storage',crops:['Potato'],distance:18,rate:5,handling:500,transport:1600,capacity:'60 quintals',note:'Potato-specific temperature regime; suitability must be confirmed in a real booking.'}
];
export function quote(raw:{facility:string;crop:string;quantity:number;duration:number}) {
 const f=facilities.find(x=>x.id===raw.facility);if(!f)throw new Error('Choose a facility.');
 if(!f.crops.includes(raw.crop))throw new Error('This facility is not suitable for this crop.');
 const quantity=number(raw.quantity,'Quantity',0.01,10000),duration=number(raw.duration,'Storage days',1,365);
 if(!Number.isInteger(duration)) throw new Error('Storage duration must be a whole number of days.');
 const storage=Math.round(quantity*duration*f.rate),handling=f.handling,transport=f.transport;
 return {facility:f.name,storage,handling,transport,total:storage+handling+transport};
}
const cropData = {
 Wheat:{season:'Rabi',water:'Moderate to high',days:'120–150 days',cost:[18000,25000],soils:['Loam','Clay'],risk:'Heat near grain filling; irrigation availability.',reason:'A cool-season option for irrigated loam. Check local sowing advice.'},
 Mustard:{season:'Rabi',water:'Low to moderate',days:'110–140 days',cost:[12000,18000],soils:['Loam','Sandy'],risk:'Aphids and frost during flowering.',reason:'An option with lower irrigation demand on well-drained soil.'},
 Chickpea:{season:'Rabi',water:'Low',days:'100–130 days',cost:[11000,17000],soils:['Loam','Clay'],risk:'Waterlogging and pod borer.',reason:'A pulse option for limited water and crop diversification.'},
 Rice:{season:'Kharif',water:'High',days:'110–150 days',cost:[22000,32000],soils:['Clay','Loam'],risk:'High water demand; flooding and pest pressure.',reason:'Consider only with reliable water and appropriate local conditions.'},
 Millet:{season:'Kharif',water:'Low',days:'75–100 days',cost:[9000,15000],soils:['Sandy','Loam'],risk:'Buyer access and establishment rainfall.',reason:'A lower-water option for warm-season planning.'},
 Maize:{season:'Kharif',water:'Moderate',days:'90–120 days',cost:[15000,22000],soils:['Loam','Sandy'],risk:'Waterlogging and fall armyworm.',reason:'Consider on well-drained soil with moderate water access.'}
};
export function plan(p:Profile) {
 if(!p.district?.trim()||!p.state?.trim()||!['Rabi','Kharif'].includes(p.season))throw new Error('Add your district, state and growing season before comparing crops.');
 const area=number(p.area,'Land area',0.01,10000)*(p.unit==='hectares'?2.47105:1),budget=number(p.budget,'Budget',1,10000000);
 if(!['acres','hectares'].includes(p.unit))throw new Error('Choose acres or hectares.');
 const missing=[p.soil==='unknown'?'soil test / soil type':null,p.ph==='unknown'?'soil pH':null,p.water==='unknown'?'water availability':null].filter(Boolean);
 const options=Object.entries(cropData).filter(([,c])=>c.season===p.season).map(([crop,c])=>{
   const reasons=[c.reason];let fit='Consider';let points=0;
   if(c.soils.includes(p.soil)){points+=2;reasons.push('Your selected soil type is included in the demonstration rule.');}
   if((p.water==='Limited'||p.irrigation==='Unavailable')&&['Wheat','Rice'].includes(crop)){points-=3;reasons.push('Water access is a constraint; do not commit without local advice.');}
   if(p.water==='Limited'&&['Millet','Mustard','Chickpea'].includes(crop))points+=2;
   if(p.previousCrop===crop){points-=1;reasons.push('The previous crop is the same. Review rotation and pest risk.');}
   if(budget<c.cost[0]*area){points-=2;reasons.push('Your budget is below this sample cultivation-cost range.');}
   if(p.soil==='unknown'||p.water==='unknown')fit='More information needed';else fit=points>=2?'Possible fit':points<0?'Review constraints':'Consider';
   return {crop,...c,fit,reasons,points,totalCost:c.cost.map(n=>Math.round(n*area)),missing};
 }).sort((a,b)=>b.points-a.points);
 return {options,missing,area};
}
export function seed():Workspace {
 const closes=new Date(Date.now()+7*86400000).toISOString();
 return {profile:{...defaultProfile},listings:[{id:'lot-wheat',crop:'Wheat',variety:'HD 3086',quantity:20,grade:'Sample Grade A',location:'Karnal, Haryana',harvest:'2026-04-15',reserve:2350,closes,quality:'Illustrative moisture: 12%. No laboratory report uploaded or verified.',image:'wheat',status:'open',bids:[{id:'bid-1',buyer:'Sample buyer · Haryana Foods',price:2450,transport:2600,fee:0,at:new Date().toISOString()},{id:'bid-2',buyer:'Sample buyer · Karnal Mill',price:2400,transport:1200,fee:0,at:new Date().toISOString()}]}],comparisons:[],bookings:[],interests:[],enquiries:[],tasks:[]};
}
export type Action = {type:string;payload:any};
export function mutate(state:Workspace,action:Action):Workspace {
 const s=structuredClone(state),p=action.payload||{},at=new Date().toISOString(),id=()=>crypto.randomUUID();
 switch(action.type){
 case 'profile': {
  const profile:Profile={...s.profile,...p,configured:true};
  profile.name=clean(profile.name,'Name',80);profile.district=clean(profile.district,'District',80);profile.state=clean(profile.state,'State',80);
  profile.area=number(profile.area,'Land area',0.01,10000);profile.budget=number(profile.budget,'Budget',1,10000000);
  if(!['en','hi'].includes(profile.language)||!['acres','hectares'].includes(profile.unit)||!['Rabi','Kharif'].includes(profile.season)||!['Loam','Clay','Sandy','unknown'].includes(profile.soil)||!['Available','Unavailable'].includes(profile.irrigation)||!['Adequate','Limited','unknown'].includes(profile.water))throw new Error('Choose valid language, units, season, soil and water options.');
  if(profile.ph!=='unknown')number(profile.ph,'Soil pH',0,14);
  s.profile=profile;break;
 }
 case 'listing': {
  const old=p.id?s.listings.find(x=>x.id===p.id):undefined;
  if(p.id&&!old)throw new Error('Listing not found.');
  if(old&&(old.status!=='open'||old.bids.length>0))throw new Error('A listing with bids or an accepted offer cannot be edited. Create a new lot instead.');
  const closes=clean(p.closes,'Auction closing time'),harvest=clean(p.harvest,'Harvest date');
  if(!Number.isFinite(Date.parse(closes))||Date.parse(closes)<=Date.now())throw new Error('Auction close must be in the future.');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(harvest)||!Number.isFinite(Date.parse(harvest))||new Date(harvest).toISOString().slice(0,10)!==harvest||Date.parse(harvest)>Date.now())throw new Error('Harvest date must be a valid date on or before today.');
  const crop=clean(p.crop,'Crop');if(!['Wheat','Mustard','Chickpea','Rice','Potato','Millet','Maize'].includes(crop))throw new Error('Choose a supported crop.');
  const listing:Listing={id:old?.id||id(),crop,variety:clean(p.variety,'Variety',80),quantity:number(p.quantity,'Quantity',0.01,10000),reserve:number(p.reserve,'Reserve price',1,1000000),grade:clean(p.grade,'Grade',80),location:clean(p.location,'Location',120),harvest,closes:new Date(closes).toISOString(),quality:clean(p.quality,'Quality information',600),image:crop==='Potato'?'potato':'wheat',status:'open',bids:[]};
  if(old)s.listings=s.listings.map(x=>x.id===old.id?listing:x);else{if(s.listings.length>=100)throw new Error('Demo limit: 100 listings.');s.listings.unshift(listing);}break;
 }
 case 'bid': {
  const l=s.listings.find(x=>x.id===p.listingId);if(!l)throw new Error('Listing not found.');
  if(l.status!=='open'||Date.parse(l.closes)<=Date.now())throw new Error('This auction is closed.');
  const price=number(p.price,'Bid price',l.reserve,1000000),transport=number(p.transport,'Transport',0,10000000),fee=number(p.fee??0,'Fee',0,10000000);
  if(l.bids.length>=100)throw new Error('Demo limit: 100 bids per lot.');
  l.bids.push({id:id(),buyer:'Sample buyer · '+clean(p.buyer,'Buyer name',70).replace(/^Sample buyer · /,''),price,transport,fee,at});break;
 }
 case 'acceptBid': {
  const l=s.listings.find(x=>x.id===p.listingId);if(!l||l.status!=='open'||Date.parse(l.closes)<=Date.now())throw new Error('This auction is no longer open.');
  if(!l.bids.find(x=>x.id===p.bidId))throw new Error('Offer not found.');l.status='accepted';l.acceptedBid=p.bidId;break;
 }
 case 'comparison':{const result=calculate(p);if(s.comparisons.length>=100)s.comparisons.pop();s.comparisons.unshift({id:id(),input:result.input,createdAt:at});break;}
 case 'booking':{
  const q=quote(p);const start=clean(p.start,'Storage start');if(!Number.isFinite(Date.parse(start))||start<new Date().toISOString().slice(0,10))throw new Error('Choose a storage start date today or later.');
  if(s.bookings.length>=100)throw new Error('Demo limit: 100 bookings.');
  s.bookings.unshift({id:id(),...q,crop:clean(p.crop,'Crop'),quantity:number(p.quantity,'Quantity',0.01,10000),duration:number(p.duration,'Duration',1,365),pickup:clean(p.pickup,'Pickup location',160),start,status:0,createdAt:at});break;
 }
 case 'advanceBooking':{const b=s.bookings.find(x=>x.id===p.id);if(!b||b.status>=4)throw new Error('This request has no further demo steps.');b.status++;break;}
 case 'interest':{
  if(s.interests.length>=100)throw new Error('Demo limit reached.');
  s.interests.unshift({id:id(),item:clean(p.item,'Item'),quantity:number(p.quantity,'Quantity',1,10000),date:typeof p.date==='string'?p.date.slice(0,10):'',at});break;
 }
 case 'enquiry':{if(s.enquiries.length>=100)throw new Error('Demo limit reached.');s.enquiries.unshift({id:id(),kind:clean(p.kind,'Request type',80),message:clean(p.message,'Message',1200),at});break;}
 case 'task':{const task=clean(p.id,'Task');if(s.tasks.includes(task))s.tasks=s.tasks.filter(x=>x!==task);else s.tasks.push(task);break;}
 case 'reset':return seed();
 default:throw new Error('Unsupported action.');
 }
 return s;
}
