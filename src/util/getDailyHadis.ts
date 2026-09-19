import { hadisList } from "../data/hadis";

export function getDailyHadis() {
  const today = new Date();

  const uniqueDayNumber = Math.floor(
    today.getTime() / (1000 * 60 * 60 * 24)
  );

  const hadisIndex = uniqueDayNumber % hadisList.length;

  return hadisList[hadisIndex];
}