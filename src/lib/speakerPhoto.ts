import abuZaki from "@/assets/ustaz/dr-abu-zaki.jpg";
import khairatul from "@/assets/ustaz/dr_khairatul.png";
import ramli from "@/assets/ustaz/Hj_ramli.png";
import imamFahee from "@/assets/ustaz/Imam_Fahee.jpg";
import azihal from "@/assets/ustaz/PU_Azihal.jpg";
import akram from "@/assets/ustaz/pu_akram.jpg";
import izzat from "@/assets/ustaz/pu_izzat.png";
import solatRaya from "@/assets/ustaz/solat_raya.png";
import baharudin from "@/assets/ustaz/ustaz_baharudin.jpg";
import elyas from "@/assets/ustaz/ustaz_elyas.jpg";
import fahmi from "@/assets/ustaz/ustaz_fahmi.png";
import fendy from "@/assets/ustaz/ustaz_fendy.png";
import hasbullah from "@/assets/ustaz/ustaz_hasbullah.jpg";
import kosi from "@/assets/ustaz/ustaz_kosi.png";
import najmi from "@/assets/ustaz/ustaz_najmi.jpg";
import nik from "@/assets/ustaz/ustaz_nik.png";
import rasyidi from "@/assets/ustaz/ustaz_rasyidi.jpg";
import rozie from "@/assets/ustaz/ustaz_rozie.png";
import saifulah from "@/assets/ustaz/ustaz_saifulah.png";
import syawal from "@/assets/ustaz/ustaz_syawal.png";
import zukri from "@/assets/ustaz/ustaz_zukri.jpg";
import sirajuddin from "@/assets/ustaz/ust_siraj.png";
import dzikri from "@/assets/ustaz/ust_dzikri.jpg";
import jamir from "@/assets/ustaz/jamir_kodiang.png";
import imamSurau from "@/assets/ustaz/yassin.jpg";
import ajk from "@/assets/ustaz/kelas_mengaji.png";
import ziarah from "@/assets/ustaz/ziarah.jpeg";

const SPEAKER_PHOTOS: Record<string, string> = {
  fahmi,
  saifullah: saifulah,
  saifulah,
  rasyidi,
  najmi,
  fendy,
  elyas,
  sirajuddin,
  azihal,
  akram,
  "abu zaki": abuZaki,
  khairatul,
  ramli,
  nik,
  rozie,
  kosi,
  izzat,
  syawal,
  dzikri,
  jamir,
  hasbullah,
  "imam surau": imamSurau,
  "imam fahee": imamFahee,
  ajk,
  ziarah,
  baharudin,
  zukri,
};

/** Finds the first matching speaker or activity keyword and returns its local image. */
export function getSpeakerPhoto(penceramah?: string, tajuk?: string) {
  const search = `${penceramah ?? ""} ${tajuk ?? ""}`.toLocaleLowerCase("ms-MY");
  if (!search.trim()) return null;

  // Raya artwork always takes priority over a named speaker.
  if (search.includes("aidiladha")) return solatRaya;

  for (const [keyword, photo] of Object.entries(SPEAKER_PHOTOS)) {
    if (search.includes(keyword)) return photo;
  }
  return null;
}
