// All values below are illustrative planning assumptions, not verified agronomic advice.
export const CROP_ASSUMPTIONS = [
  { crop: 'Wheat', varieties: 'Lokwan · HI 1544 · MP Sharbati', soils: ['Black soil', 'Alluvial', 'Sandy loam'], seasons: ['rabi'], water: ['Canal', 'Borewell'], waterNeed: 'Medium (450–650 mm)', rainMm: 500, costPerAcre: 34200, yield: [16, 21], price: 2275, tone: 'wheat', tag: 'RABI CROP' },
  { crop: 'Soybean', varieties: 'JS 20-29 · RVS 2001-4', soils: ['Black soil', 'Red soil'], seasons: ['kharif'], water: ['Rainfed', 'Canal', 'Borewell'], waterNeed: 'Medium (450–700 mm)', rainMm: 600, costPerAcre: 28400, yield: [7, 11], price: 4680, tone: 'soybean', tag: 'OILSEED' },
  { crop: 'Chickpea', varieties: 'JG 14 · JG 130 · RVG 202', soils: ['Black soil', 'Alluvial', 'Sandy loam'], seasons: ['rabi'], water: ['Rainfed', 'Canal', 'Borewell'], waterNeed: 'Low (300–450 mm)', rainMm: 350, costPerAcre: 24100, yield: [6, 10], price: 5650, tone: 'chickpea', tag: 'LOW WATER' },
  { crop: 'Maize', varieties: 'Narmada 141 · HQPM 1', soils: ['Alluvial', 'Red soil', 'Black soil'], seasons: ['kharif', 'zaid'], water: ['Canal', 'Borewell'], waterNeed: 'Medium-high (500–800 mm)', rainMm: 650, costPerAcre: 31700, yield: [18, 27], price: 2090, tone: 'wheat', tag: 'CEREAL' },
  { crop: 'Mustard', varieties: 'Pusa Mustard 25 · RH 725', soils: ['Alluvial', 'Black soil', 'Sandy loam'], seasons: ['rabi'], water: ['Rainfed', 'Canal', 'Borewell'], waterNeed: 'Low (250–400 mm)', rainMm: 300, costPerAcre: 21800, yield: [5, 8], price: 5650, tone: 'chickpea', tag: 'LOW WATER' },
  { crop: 'Cotton', varieties: 'Bt cotton · Suraj', soils: ['Black soil', 'Alluvial'], seasons: ['kharif'], water: ['Canal', 'Borewell'], waterNeed: 'High (700–1,200 mm)', rainMm: 900, costPerAcre: 42100, yield: [6, 10], price: 7120, tone: 'soybean', tag: 'FIBRE CROP' },
  { crop: 'Sorghum', varieties: 'CSV 27 · CSH 16', soils: ['Black soil', 'Red soil', 'Sandy loam'], seasons: ['kharif', 'rabi'], water: ['Rainfed', 'Canal', 'Borewell'], waterNeed: 'Low-medium (350–550 mm)', rainMm: 450, costPerAcre: 19600, yield: [10, 16], price: 3180, tone: 'wheat', tag: 'DROUGHT TOLERANT' },
]
const seasonKey = value => /kharif/i.test(value || '') ? 'kharif' : /zaid|summer/i.test(value || '') ? 'zaid' : /rabi/i.test(value || '') ? 'rabi' : null
const waterAmount = value => ({ Rainfed: 400, Canal: 650, Borewell: 850 })[value] ?? null

export function scoreCrops(profile = {}, assumptions = CROP_ASSUMPTIONS) {
  const season = seasonKey(profile.season)
  const water = waterAmount(profile.water)
  const location = String(profile.location || '').trim()
  return assumptions.map(item => {
    let score = 40
    const reasons = []
    if (profile.soil) {
      if (item.soils.includes(profile.soil)) { score += 20; reasons.push(`Soil match: ${profile.soil} is listed as suitable.`) }
      else { score -= 14; reasons.push(`Soil note: ${profile.soil} is not in this crop’s preferred soil set.`) }
    } else reasons.push('Soil type missing; soil compatibility is not scored.')
    if (season) {
      if (item.seasons.includes(season)) { score += 28; reasons.push(`Season match: suitable for ${season}.`) }
      else { score -= 28; reasons.push(`Season mismatch: listed seasons are ${item.seasons.join(', ')}.`) }
    } else reasons.push('Season missing; season suitability is not scored.')
    if (water != null) {
      const balance = water - item.rainMm
      if (balance >= 150) { score += 15; reasons.push(`Water estimate (${water} mm) comfortably covers assumed ${item.rainMm} mm need.`) }
      else if (balance >= 0) { score += 8; reasons.push(`Water estimate (${water} mm) approximately covers assumed ${item.rainMm} mm need.`) }
      else { score -= 18; reasons.push(`Water risk: assumed ${item.rainMm} mm need exceeds ${water} mm available.`) }
      if (item.water.includes(profile.water)) { score += 5; reasons.push(`${profile.water} irrigation is compatible with this crop.`) }
    } else reasons.push('Irrigation missing; water compatibility is not scored.')
    const district = /indore|malwa|madhya pradesh|mp/i.test(location)
    if (location) { if (district) { score += 4; reasons.push('Location context: Indore/Malwa sample assumptions applied.') } else reasons.push('Location is recorded; no local crop dataset is available, so no location bonus was applied.') }
    const costPenalty = Math.min(10, Math.round(item.costPerAcre / 8000))
    score -= costPenalty
    reasons.push(`Cost adjustment: ₹${item.costPerAcre.toLocaleString('en-IN')}/acre illustrative cost (−${costPenalty} points).`)
    score = Math.max(0, Math.min(100, score))
    const acres = Math.max(0, Number(profile.land) || 0)
    const revenue = item.yield.map(y => y * item.price)
    const profit = revenue.map(r => r - item.costPerAcre)
    return { ...item, score, reasons, acres, revenueRange: revenue, profitRange: profit, costForFarm: item.costPerAcre * acres, yieldRange: item.yield.map(y => y * acres) }
  }).sort((a, b) => b.score - a.score || a.crop.localeCompare(b.crop))
}
