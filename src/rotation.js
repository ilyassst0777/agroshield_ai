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

export const CRITERIA = [
  { id: 'moisture', label: 'Water conservation' },
  { id: 'soil', label: 'Soil fertility and erosion protection' },
  { id: 'quality', label: 'Wheat grain quality' },
]

// value: 1 = favorable, 0 = mixed evidence, -1 = unfavorable, null = no evidence in our sources
// Notes are our own summaries. Read the original papers before relying on them.
export const ROTATIONS = [
  {
    id: 'fallow',
    name: 'Wheat with summer fallow',
    effects: {
      moisture: {
        value: 0,
        note: 'Sources disagree: one reports fallow stores 15-20 mm more moisture than stubble, another calls fallow inefficient for moisture storage in semiarid conditions.',
        sources: ['suleimenov', 'shortandy'],
      },
      soil: {
        value: -1,
        note: 'Fallow-based systems are linked in the sources to erosion risk and declining soil fertility.',
        sources: ['suleimenov', 'shortandy'],
      },
      quality: {
        value: 1,
        note: 'Wheat grain quality was higher in a grain-fallow rotation in a Karabalyk station study.',
        sources: ['karpukhin'],
      },
    },
  },
  {
    id: 'diversified',
    name: 'Diversified rotation without fallow',
    effects: {
      moisture: { value: null, note: 'No direct evidence in our sources.', sources: [] },
      soil: {
        value: 1,
        note: 'Northern Kazakhstan experiments found cropland is used most efficiently in diversified rotations without fallow.',
        sources: ['suleimenov'],
      },
      quality: {
        value: -1,
        note: 'Wheat grain quality was lower than in the grain-fallow rotation in a Karabalyk station study.',
        sources: ['karpukhin'],
      },
    },
  },
  {
    id: 'pulses',
    name: 'Pulses (for example dry pea) replacing fallow',
    effects: {
      moisture: {
        value: 0,
        note: 'Mixed: one Shortandy study reports that legumes did not play a positive role in dryland conditions (check the paper for details).',
        sources: ['shortandy'],
      },
      soil: {
        value: 1,
        note: 'Research in northern Kazakhstan suggests replacing fallow with pulses or legume forages, together with nitrogen application, helps conserve soil fertility.',
        sources: ['suleimenov'],
      },
      quality: { value: null, note: 'No evidence in our sources.', sources: [] },
    },
  },
]

// Optional practice that can be combined with any rotation
export const NO_TILL = {
  name: 'No-till (zero tillage)',
  effects: {
    moisture: {
      value: 1,
      note: 'Soil moisture was used more economically, and in a drought year average wheat yield was higher with zero tillage.',
      sources: ['popova', 'karpukhin'],
    },
    soil: {
      value: 1,
      note: 'More plant residues stay on and in the top soil layer, and wind erosion is excluded.',
      sources: ['popova', 'karpukhin'],
    },
    quality: {
      value: -1,
      note: 'Gluten content of wheat grain decreased with zero tillage.',
      sources: ['karpukhin'],
    },
  },
}