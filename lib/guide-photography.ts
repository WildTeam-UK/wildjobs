import type { SectorGuideSlug } from "./guide-sectors";
import type { CareerRoleSlug } from "./career-role-catalog";

export type GuidePhotography = {
  image: string;
  imageAlt: string;
  creatorName: string;
  sourceUrl: string;
  objectPosition?: string;
};

const photos = {
  "wind-energy": {
    image: "/images/guides/wind-energy.jpg",
    imageAlt: "Wind turbines above a lake and reeds",
    creatorName: "Ngoc Nguyen Phuong",
    sourceUrl:
      "https://unsplash.com/photos/wind-turbines-on-a-hill-overlooking-a-lake-with-reeds-KccrgchP9xI",
  },
  birdwatching: {
    image: "/images/guides/birdwatching.jpg",
    imageAlt: "A person observing wildlife through binoculars in a forest",
    creatorName: "Ryan Magsino",
    sourceUrl: "https://unsplash.com/photos/woman-using-binoculars-in-forest-ugCMOgP4J7I",
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
  solar: {
    image: "/images/guides/solar.jpg",
    imageAlt: "Rows of solar panels in the countryside",
    creatorName: "Mariana Proença",
    sourceUrl: "https://unsplash.com/photos/solar-panels-during-daytime-mG8sgwkMhCY",
  },
  greenway: {
    image: "/images/guides/greenway.jpg",
    imageAlt: "A cyclist following a path through woodland",
    creatorName: "Klara Kulikova",
    sourceUrl:
      "https://unsplash.com/photos/a-person-riding-a-bicycle-on-a-path-surrounded-by-trees-cmmEixAFkuo",
    objectPosition: "50% 90%",
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
  "environmental-education": photos["birdwatching"],
  "environmental-management": photos["restoration"],
  "food-farming-horticulture": photos["soil"],
  "marine-conservation": photos["marine"],
  "policy-campaigning": photos["wetland"],
  "rivers-water-hydrology": photos["wetland"],
  sustainability: photos["solar"],
  "sustainable-transport": photos["greenway"],
  ecologist: photos["woodland"],
  "project-manager": photos["teamwork"],
  "project-officer": photos["restoration"],
  "environmental-educator": photos["birdwatching"],
  biologist: photos["biology"],
  "chief-executive": photos["teamwork"],
};
