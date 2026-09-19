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
import liveAbuZaki from "@/assets/ustaz_live/dr-abu-zaki.png";
import liveKhairatul from "@/assets/ustaz_live/dr_khairatul.png";
import liveRamli from "@/assets/ustaz_live/Hj_ramli.png";
import liveImamFahee from "@/assets/ustaz_live/Imam_Fahee.jpg";
import liveAzihal from "@/assets/ustaz_live/PU_Azihal.png";
import liveAkram from "@/assets/ustaz_live/pu_akram.png";
import liveIzzat from "@/assets/ustaz_live/pu_izzat.png";
import liveSolatRaya from "@/assets/ustaz_live/solat_raya.png";
import liveBaharudin from "@/assets/ustaz_live/ustaz_baharudin.jpg";
import liveElyas from "@/assets/ustaz_live/ustaz_elyas.png";
import liveFahmi from "@/assets/ustaz_live/ustaz_fahmi.png";
import liveFendy from "@/assets/ustaz_live/ustaz_fendy.png";
import liveHasbullah from "@/assets/ustaz_live/ustaz_hasbullah.jpg";
import liveKosi from "@/assets/ustaz_live/ustaz_kosi.png";
import liveNajmi from "@/assets/ustaz_live/ustaz_najmi.png";
import liveNik from "@/assets/ustaz_live/ustaz_nik.png";
import liveRasyidi from "@/assets/ustaz_live/ustaz_rasyidi.png";
import liveRozie from "@/assets/ustaz_live/ustaz_rozie.png";
import liveSaifulah from "@/assets/ustaz_live/ustaz_saifulah.png";
import liveSyawal from "@/assets/ustaz_live/ustaz_syawal.png";
import liveZukri from "@/assets/ustaz_live/ustaz_zukri.jpg";
import liveSirajuddin from "@/assets/ustaz_live/ust_siraj.png";
import liveDzikri from "@/assets/ustaz_live/ust_dzikri.png";
import liveJamir from "@/assets/ustaz_live/jamir_kodiang.png";
import liveImamSurau from "@/assets/ustaz_live/yassin.png";
import liveAjk from "@/assets/ustaz_live/kelas_mengaji.png";
import liveZiarah from "@/assets/ustaz_live/ziarah.jpeg";

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

const LIVE_SPEAKER_PHOTOS: Record<string, string> = {
  fahmi: liveFahmi,
  saifullah: liveSaifulah,
  saifulah: liveSaifulah,
  rasyidi: liveRasyidi,
  najmi: liveNajmi,
  fendy: liveFendy,
  elyas: liveElyas,
  sirajuddin: liveSirajuddin,
  azihal: liveAzihal,
  akram: liveAkram,
  "abu zaki": liveAbuZaki,
  khairatul: liveKhairatul,
  ramli: liveRamli,
  nik: liveNik,
  rozie: liveRozie,
  kosi: liveKosi,
  izzat: liveIzzat,
  syawal: liveSyawal,
  dzikri: liveDzikri,
  jamir: liveJamir,
  hasbullah: liveHasbullah,
  "imam surau": liveImamSurau,
  "imam fahee": liveImamFahee,
  ajk: liveAjk,
  ziarah: liveZiarah,
  baharudin: liveBaharudin,
  zukri: liveZukri,
};

/** Finds the first matching speaker or activity keyword and returns its local image. */
function findSpeakerPhoto(
  penceramah: string | undefined,
  tajuk: string | undefined,
  photos: Record<string, string>,
  rayaPhoto: string,
) {
  const search = `${penceramah ?? ""} ${tajuk ?? ""}`.toLocaleLowerCase("ms-MY");
  if (!search.trim()) return null;

  // Raya artwork always takes priority over a named speaker.
  if (search.includes("aidiladha")) return rayaPhoto;

  for (const [keyword, photo] of Object.entries(photos)) {
    if (search.includes(keyword)) return photo;
  }
  return null;
}

export function getSpeakerPhoto(penceramah?: string, tajuk?: string) {
  return findSpeakerPhoto(penceramah, tajuk, SPEAKER_PHOTOS, solatRaya);
}

export function getLiveSpeakerPhoto(penceramah?: string, tajuk?: string) {
  return findSpeakerPhoto(penceramah, tajuk, LIVE_SPEAKER_PHOTOS, liveSolatRaya);
}
