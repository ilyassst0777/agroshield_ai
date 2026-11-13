export const SOURCES = {
  suleimenov: {
    label: 'Suleimenov et al., Principles of Conservation Agriculture in Continental Steppe Regions (Springer, 2016)',
    url: 'https://link.springer.com/chapter/10.1007/978-3-319-24409-9_30',
  },
  karpukhin: {
    label: 'Karpukhin & Grinets, Resource-saving technologies in the steppe zone of Northern Kazakhstan (2016)',
    url: 'https://agris.fao.org/search/en/records/6473a3d013d110e4e7a78389',
  },
  popova: {
    label: 'Popova et al., resource-saving technologies in grain-fallow 8-field crop rotation, Kostanay region',
    url: 'https://agris.fao.org/search/en/records/647473f879cbb2c2c1b3714d',
  },
  shortandy: {
    label: 'Role of Wheat in Diversified Cropping Systems in Dryland Agriculture of Central Asia (Shortandy trials)',
    url: 'https://aj.tubitak.gov.tr/agriculture/issues/tar-05-29-2/tar-29-2-7-0312-15.pdf',
  },
}

export const CRITERIA = ['moisture', 'soil', 'quality']

// value: 1 = favorable, 0 = mixed evidence, -1 = unfavorable, null = no evidence in our sources
// noteKey points to the translated summary in i18n.jsx. Read the original papers before relying on them.
export const ROTATIONS = [
  {
    id: 'fallow',
    effects: {
      moisture: { value: 0, noteKey: 'evid.fallow.moisture', sources: ['suleimenov', 'shortandy'] },
      soil: { value: -1, noteKey: 'evid.fallow.soil', sources: ['suleimenov', 'shortandy'] },
      quality: { value: 1, noteKey: 'evid.fallow.quality', sources: ['karpukhin'] },
    },
  },
  {
    id: 'diversified',
    effects: {
      moisture: { value: null, noteKey: 'evid.none', sources: [] },
      soil: { value: 1, noteKey: 'evid.diversified.soil', sources: ['suleimenov'] },
      quality: { value: -1, noteKey: 'evid.diversified.quality', sources: ['karpukhin'] },
    },
  },
  {
    id: 'pulses',
    effects: {
      moisture: { value: 0, noteKey: 'evid.pulses.moisture', sources: ['shortandy'] },
      soil: { value: 1, noteKey: 'evid.pulses.soil', sources: ['suleimenov'] },
      quality: { value: null, noteKey: 'evid.none', sources: [] },
    },
  },
]

// Optional practice that can be combined with any rotation
export const NO_TILL = {
  effects: {
    moisture: { value: 1, noteKey: 'evid.notill.moisture', sources: ['popova', 'karpukhin'] },
    soil: { value: 1, noteKey: 'evid.notill.soil', sources: ['popova', 'karpukhin'] },
    quality: { value: -1, noteKey: 'evid.notill.quality', sources: ['karpukhin'] },
  },
}