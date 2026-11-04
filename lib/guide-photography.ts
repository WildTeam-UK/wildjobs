import type { SectorGuideSlug } from "./guide-sectors";
import type { CareerRoleSlug } from "./career-role-catalog";

export type GuidePhotography = { image: string; imageAlt: string; creatorName: string; sourceUrl: string };

const photos = {
  "wind-energy": {
    image: "/images/guides/wind-energy.jpg",
    imageAlt: "Wind turbines above a lake and reeds",
    creatorName: "Ngoc Nguyen Phuong",
    sourceUrl:
      "https://unsplash.com/photos/wind-turbines-on-a-hill-overlooking-a-lake-with-reeds-KccrgchP9xI",
  },
  "environmental-education": {
    image: "/images/guides/environmental-education.jpg",
    imageAlt: "Volunteers sharing environmental information at an outdoor booth",
    creatorName: "Alba Calbetó",
    sourceUrl:
      "https://unsplash.com/photos/greenpeace-volunteers-engaging-with-public-at-outdoor-booth-74XTt1RQ1IQ",
  },
  soil: {
    image: "/images/guides/soil.jpg",
    imageAlt: "Hands holding soil in a garden",
    creatorName: "Gabriel Jimenez",
    sourceUrl: "https://unsplash.com/photos/bokeh-photography-of-person-carrying-soil-jin4W1HqgL4",
  },
  marine: {
    image: "/images/guides/marine.jpg",
    imageAlt: "A sea turtle resting above a coral reef",
    creatorName: "Kristin Hoel",
    sourceUrl: "https://unsplash.com/photos/a-sea-turtle-swimming-over-a-coral-reef-pyw39Zn6wWo",
  },
  campaigning: {
    image: "/images/guides/campaigning.jpg",
    imageAlt: "A climate campaigner holding a There Is No Planet B sign",
    creatorName: "Li-An Lim",
    sourceUrl: "https://unsplash.com/photos/person-holding-there-is-no-planet-b-poster-ycW4YxhrWHM",
  },
  solar: {
    image: "/images/guides/solar.jpg",
    imageAlt: "Rows of solar panels in the countryside",
    creatorName: "Mariana Proença",
    sourceUrl: "https://unsplash.com/photos/solar-panels-during-daytime-mG8sgwkMhCY",
  },
  cycling: {
    image: "/images/guides/cycling.jpg",
    imageAlt: "A person cycling along a city street",
    creatorName: "Danny Greenberg",
    sourceUrl: "https://unsplash.com/photos/person-riding-a-bicycle-on-a-city-street-EYhKSHNIUIE",
  },
  biology: {
    image: "/images/guides/biology.jpg",
    imageAlt: "A scientist looking through a microscope",
    creatorName: "Waldo Malan",
    sourceUrl: "https://unsplash.com/photos/a-young-scientist-examines-through-a-microscope-fSUNVY7aPEs",
  },
  teamwork: {
    image: "/images/guides/teamwork.jpg",
    imageAlt: "Colleagues working together around a table",
    creatorName: "Annie Spratt",
    sourceUrl: "https://unsplash.com/photos/group-of-people-using-laptop-computer-QckxruozjRg",
  },
  restoration: {
    image: "/images/guides/restoration-team.jpg",
    imageAlt: "Volunteers restoring habitat beside a wetland",
    creatorName: "Joe Whalen / Tampa Bay Estuary Program",
    sourceUrl: "https://unsplash.com/photos/a-group-of-people-standing-next-to-a-river-CxL29J-aM5E",
  },
  wildlife: {
    image: "/images/design/wildlife-deer.jpg",
    imageAlt: "A deer standing in woodland",
    creatorName: "Unleashed Agency",
    sourceUrl: "https://unsplash.com/photos/brown-deer-on-forest-during-daytime-SXczrJECIEo",
  },
  woodland: {
    image: "/images/design/woodland.jpg",
    imageAlt: "Sunlight falling through woodland trees",
    creatorName: "Darren Bockman",
    sourceUrl: "https://unsplash.com/photos/pN3Z2usSIQw",
  },
  wetland: {
    image: "/images/design/wetland.jpg",
    imageAlt: "A wetland landscape with water and reeds",
    creatorName: "Pascal Debrunner",
    sourceUrl: "https://unsplash.com/photos/2lPR-5MUliw",
  },
} satisfies Record<string, GuidePhotography>;

// Presentation is managed independently of reviewed guide prose and market data.
// This also replaces legacy illustrations retained in published content snapshots.
export const guidePhotography: Record<SectorGuideSlug | CareerRoleSlug, GuidePhotography> = {
  "carbon-climate-energy": photos["wind-energy"],
  "wildlife-conservation": photos["wildlife"],
  ecology: photos["woodland"],
  "environmental-education": photos["environmental-education"],
  "environmental-management": photos["restoration"],
  "food-farming-horticulture": photos["soil"],
  "marine-conservation": photos["marine"],
  "policy-campaigning": photos["campaigning"],
  "rivers-water-hydrology": photos["wetland"],
  sustainability: photos["solar"],
  "sustainable-transport": photos["cycling"],
  ecologist: photos["woodland"],
  "project-manager": photos["teamwork"],
  "project-officer": photos["restoration"],
  "environmental-educator": photos["environmental-education"],
  biologist: photos["biology"],
  "chief-executive": photos["teamwork"],
};
