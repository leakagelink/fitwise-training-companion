import clip0 from "@/assets/exercise-motion/bench-press.mp4.asset.json";
import poster0 from "@/assets/exercise-motion/bench-press.jpg.asset.json";
import clip1 from "@/assets/exercise-motion/db-bench-press.mp4.asset.json";
import poster1 from "@/assets/exercise-motion/db-bench-press.jpg.asset.json";
import clip2 from "@/assets/exercise-motion/barbell-curl.mp4.asset.json";
import poster2 from "@/assets/exercise-motion/barbell-curl.jpg.asset.json";
import clip3 from "@/assets/exercise-motion/bicep-curl.mp4.asset.json";
import poster3 from "@/assets/exercise-motion/bicep-curl.jpg.asset.json";
import clip4 from "@/assets/exercise-motion/cable-curl.mp4.asset.json";
import poster4 from "@/assets/exercise-motion/cable-curl.jpg.asset.json";
import clip5 from "@/assets/exercise-motion/barbell-lunge.mp4.asset.json";
import poster5 from "@/assets/exercise-motion/barbell-lunge.jpg.asset.json";
import clip6 from "@/assets/exercise-motion/db-lunge.mp4.asset.json";
import poster6 from "@/assets/exercise-motion/db-lunge.jpg.asset.json";
import clip7 from "@/assets/exercise-motion/face-pull.mp4.asset.json";
import poster7 from "@/assets/exercise-motion/face-pull.jpg.asset.json";
import clip8 from "@/assets/exercise-motion/lying-tricep-extension.mp4.asset.json";
import poster8 from "@/assets/exercise-motion/lying-tricep-extension.jpg.asset.json";
import clip9 from "@/assets/exercise-motion/ez-bar-lying-tricep-extension.mp4.asset.json";
import poster9 from "@/assets/exercise-motion/ez-bar-lying-tricep-extension.jpg.asset.json";
import clip10 from "@/assets/exercise-motion/front-squat.mp4.asset.json";
import poster10 from "@/assets/exercise-motion/front-squat.jpg.asset.json";
import clip11 from "@/assets/exercise-motion/hammer-curl.mp4.asset.json";
import poster11 from "@/assets/exercise-motion/hammer-curl.jpg.asset.json";
import clip12 from "@/assets/exercise-motion/cable-hammer-curl.mp4.asset.json";
import poster12 from "@/assets/exercise-motion/cable-hammer-curl.jpg.asset.json";
import clip13 from "@/assets/exercise-motion/hip-thrust.mp4.asset.json";
import poster13 from "@/assets/exercise-motion/hip-thrust.jpg.asset.json";
import clip14 from "@/assets/exercise-motion/smith-machine-squat.mp4.asset.json";
import poster14 from "@/assets/exercise-motion/smith-machine-squat.jpg.asset.json";
import clip15 from "@/assets/exercise-motion/lateral-raise.mp4.asset.json";
import poster15 from "@/assets/exercise-motion/lateral-raise.jpg.asset.json";
import clip16 from "@/assets/exercise-motion/leg-curl.mp4.asset.json";
import poster16 from "@/assets/exercise-motion/leg-curl.jpg.asset.json";
import clip17 from "@/assets/exercise-motion/seated-leg-curl.mp4.asset.json";
import poster17 from "@/assets/exercise-motion/seated-leg-curl.jpg.asset.json";
import clip18 from "@/assets/exercise-motion/leg-press.mp4.asset.json";
import poster18 from "@/assets/exercise-motion/leg-press.jpg.asset.json";
import clip19 from "@/assets/exercise-motion/wide-stance-leg-press.mp4.asset.json";
import poster19 from "@/assets/exercise-motion/wide-stance-leg-press.jpg.asset.json";
import clip20 from "@/assets/exercise-motion/romanian-deadlift.mp4.asset.json";
import poster20 from "@/assets/exercise-motion/romanian-deadlift.jpg.asset.json";
import clip21 from "@/assets/exercise-motion/incline-db-press.mp4.asset.json";
import poster21 from "@/assets/exercise-motion/incline-db-press.jpg.asset.json";
import clip22 from "@/assets/exercise-motion/incline-bench-press.mp4.asset.json";
import poster22 from "@/assets/exercise-motion/incline-bench-press.jpg.asset.json";
import clip23 from "@/assets/exercise-motion/smith-machine-shrug.mp4.asset.json";
import poster23 from "@/assets/exercise-motion/smith-machine-shrug.jpg.asset.json";
import clip24 from "@/assets/exercise-motion/seated-calf-raise.mp4.asset.json";
import poster24 from "@/assets/exercise-motion/seated-calf-raise.jpg.asset.json";
import clip25 from "@/assets/exercise-motion/standing-calf-raise.mp4.asset.json";
import poster25 from "@/assets/exercise-motion/standing-calf-raise.jpg.asset.json";
import clip26 from "@/assets/exercise-motion/tricep-kickback.mp4.asset.json";
import poster26 from "@/assets/exercise-motion/tricep-kickback.jpg.asset.json";

export interface ExerciseMotion {
  video: string;
  poster: string;
  sourceUrl: string;
  author: string;
  licenseUrl: string;
}

const motions: Record<string, ExerciseMotion> = {
  "bench-press": { video: clip0.url, poster: poster0.url, sourceUrl: "https://wger.de/media/exercise-video/73/2bdb390c-312c-4497-a722-5eed2c823e5a.MOV", author: "Goulart", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
  "db-bench-press": { video: clip1.url, poster: poster1.url, sourceUrl: "https://wger.de/media/exercise-video/75/080c799b-8afd-4130-8d72-9cef0cd79f54.MOV", author: "Goulart", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
  "barbell-curl": { video: clip2.url, poster: poster2.url, sourceUrl: "https://wger.de/media/exercise-video/91/483f4bff-e108-41f1-8e7b-0caf24952552.MOV", author: "Goulart", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
  "bicep-curl": { video: clip3.url, poster: poster3.url, sourceUrl: "https://wger.de/media/exercise-video/92/8bfb917c-3d0d-49b9-8073-5d7e01c1b894.MOV", author: "Goulart", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
  "cable-curl": { video: clip4.url, poster: poster4.url, sourceUrl: "https://wger.de/media/exercise-video/95/ab770931-47d3-44fd-aef0-ac7a64c3b794.MOV", author: "Goulart", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
  "barbell-lunge": { video: clip5.url, poster: poster5.url, sourceUrl: "https://wger.de/media/exercise-video/46/d45df7af-586b-42d0-bc56-d1e028812f12.MOV", author: "Goulart", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
  "db-lunge": { video: clip6.url, poster: poster6.url, sourceUrl: "https://wger.de/media/exercise-video/205/c167ac34-ddbc-4e1b-8edf-1192e9d00e22.MOV", author: "Goulart", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
  "face-pull": { video: clip7.url, poster: poster7.url, sourceUrl: "https://wger.de/media/exercise-video/222/eea93fcc-6a3c-4783-8f70-0234c791a001.MOV", author: "Goulart", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
  "lying-tricep-extension": { video: clip8.url, poster: poster8.url, sourceUrl: "https://wger.de/media/exercise-video/245/c253303e-9160-4f1f-b4fe-daf1e6c8661d.MOV", author: "Goulart", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
  "ez-bar-lying-tricep-extension": { video: clip9.url, poster: poster9.url, sourceUrl: "https://wger.de/media/exercise-video/246/2a194d11-ff5d-4bdf-849e-1c441cf7b0b1.MOV", author: "Goulart", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
  "front-squat": { video: clip10.url, poster: poster10.url, sourceUrl: "https://wger.de/media/exercise-video/257/93145935-29db-4e52-9d2d-174b1c30c098.MOV", author: "Goulart", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
  "hammer-curl": { video: clip11.url, poster: poster11.url, sourceUrl: "https://wger.de/media/exercise-video/272/df069052-2173-4f24-855f-a0eebe729f24.MOV", author: "Goulart", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
  "cable-hammer-curl": { video: clip12.url, poster: poster12.url, sourceUrl: "https://wger.de/media/exercise-video/275/af1fff93-eb58-4ba7-97a4-b38ee67853b4.MOV", author: "Goulart", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
  "hip-thrust": { video: clip13.url, poster: poster13.url, sourceUrl: "https://wger.de/media/exercise-video/294/45bacf4b-1bb6-4d47-8bd1-9f00eddd4019.MOV", author: "Goulart", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
  "smith-machine-squat": { video: clip14.url, poster: poster14.url, sourceUrl: "https://wger.de/media/exercise-video/341/0cbfeace-dda9-4166-8424-f51358e88a4f.MOV", author: "Goulart", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
  "lateral-raise": { video: clip15.url, poster: poster15.url, sourceUrl: "https://wger.de/media/exercise-video/348/de69928a-8a35-4096-821c-1f46de5e0e03.MOV", author: "Goulart", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
  "leg-curl": { video: clip16.url, poster: poster16.url, sourceUrl: "https://wger.de/media/exercise-video/365/becaf013-5044-40d0-bae9-7ed60c973737.MOV", author: "Goulart", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
  "seated-leg-curl": { video: clip17.url, poster: poster17.url, sourceUrl: "https://wger.de/media/exercise-video/366/43df4b79-d4c3-4fbf-bcb5-e0d825b84120.MOV", author: "Goulart", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
  "leg-press": { video: clip18.url, poster: poster18.url, sourceUrl: "https://wger.de/media/exercise-video/371/6aae16b4-01b9-4eb4-935c-3250f84d2c59.MOV", author: "Goulart", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
  "wide-stance-leg-press": { video: clip19.url, poster: poster19.url, sourceUrl: "https://wger.de/media/exercise-video/374/5336822a-7803-45b3-a880-f2bbf37a28f2.MOV", author: "Goulart", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
  "romanian-deadlift": { video: clip20.url, poster: poster20.url, sourceUrl: "https://wger.de/media/exercise-video/507/307e7276-a14d-4ea0-b579-f5b0dbc6f5af.MOV", author: "Goulart", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
  "incline-db-press": { video: clip21.url, poster: poster21.url, sourceUrl: "https://wger.de/media/exercise-video/537/b9c937e9-daeb-42a9-be8e-7a77e368478c.MOV", author: "Goulart", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
  "incline-bench-press": { video: clip22.url, poster: poster22.url, sourceUrl: "https://wger.de/media/exercise-video/538/4349a6f6-4cee-4c09-828b-c5e7fc2c1ff1.MOV", author: "Goulart", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
  "smith-machine-shrug": { video: clip23.url, poster: poster23.url, sourceUrl: "https://wger.de/media/exercise-video/575/a7d99f2b-86fc-433a-8ab1-83144c802296.MOV", author: "Goulart", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
  "seated-calf-raise": { video: clip24.url, poster: poster24.url, sourceUrl: "https://wger.de/media/exercise-video/590/a325ae2e-686b-4a1f-aff2-ba37fa3fa157.MOV", author: "Goulart", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
  "standing-calf-raise": { video: clip25.url, poster: poster25.url, sourceUrl: "https://wger.de/media/exercise-video/622/461171e5-2b16-407d-bf27-27aeef43f105.MOV", author: "Goulart", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
  "tricep-kickback": { video: clip26.url, poster: poster26.url, sourceUrl: "https://wger.de/media/exercise-video/655/2d88a05b-bde3-4026-bfbf-524c11068dc5.MOV", author: "Goulart", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
};

export function exerciseMotion(id: string): ExerciseMotion | undefined {
  return motions[id];
}
