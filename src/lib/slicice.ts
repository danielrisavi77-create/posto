// Vinjeta uz stavku: jednobojni znak (font Noto Emoji) koji se tiska u medaljon kao gravura na novčanici.
// Redoslijed je bitan: prvo uži pojmovi, pa širi.
const PRAVILA: [RegExp, string][] = [
  [/plaća|mirovina/, "💶"], [/tekućeg računa/, "🏦"], [/kvadrat/, "🏢"], [/hrt/, "📺"], [/dopunsko/, "🏥"],
  [/plitvič/, "🏞"], [/zidine/, "🏰"], [/kino/, "🎬"], [/kazališt/, "🎭"], [/bazen/, "🏊"], [/teretana/, "🏋"],
  [/tečaj/, "🗣"], [/šišanje/, "✂"], [/pedikura/, "💅"], [/masaža/, "💆"], [/automobila/, "🚗"], [/kemijsko/, "👔"],
  [/bojler/, "🔧"], [/krvna/, "🩸"], [/zubnog/, "🦷"], [/tablete|protiv kašlja/, "💊"],
  [/četkica|pasta za zube/, "🪥"], [/prašak|deterdžent|stakla/, "🧽"], [/sapun|gel za|šampon|krema/, "🧴"],
  [/kašica/, "🍼"], [/espresso|kava/, "☕"], [/čaj u/, "🍵"], [/pivo/, "🍺"], [/vino/, "🍷"],
  [/gazirani sok|sok u kafiću/, "🥤"], [/voda/, "💧"], [/sok|sirup/, "🧃"],
  [/krafna/, "🍩"], [/kruh|pecivo|tost/, "🍞"], [/pizza/, "🍕"], [/špageti|tjestenina/, "🍝"], [/juha/, "🍲"], [/odrezak/, "🍽"],
  [/sirni|sir$/, "🧀"], [/maslac|margarin/, "🧈"], [/jogurt|pahuljice/, "🥣"], [/mlijeko/, "🥛"], [/jaja/, "🥚"],
  [/lješnjak/, "🌰"], [/čokolad/, "🍫"], [/keks|napolitanke/, "🍪"], [/čips/, "🍟"], [/med$/, "🍯"], [/džem/, "🍓"], [/šećer/, "🥄"],
  [/sol$|vegeta/, "🧂"], [/ulje/, "🌻"], [/brašno|krupica/, "🌾"], [/riža/, "🍚"], [/grah/, "🫘"],
  [/sardine|tuna|oslić/, "🐟"], [/pile/, "🍗"], [/slanina/, "🥓"], [/hrenovke|kobasica/, "🌭"], [/svinjski|junetina|teleća|kotleti|šunka|salama|mortadela/, "🥩"],
  [/pašteta|majoneza|koncentrat/, "🥫"], [/krumpir/, "🥔"], [/luk$/, "🧅"], [/češnjak/, "🧄"], [/mrkva/, "🥕"], [/rajčice/, "🍅"],
  [/paprika/, "🫑"], [/brokula/, "🥦"], [/kelj|kupus|zelje|špinat/, "🥬"], [/tikvice|krastavci/, "🥒"], [/šampinjoni/, "🍄"],
  [/banane/, "🍌"], [/jabuke/, "🍎"], [/limuni/, "🍋"], [/mandarine|naranče/, "🍊"],
];

export function slicica(ime: string): string {
  const n = ime.toLowerCase();
  for (const [uzorak, znak] of PRAVILA) if (uzorak.test(n)) return znak;
  return "🧾";
}
