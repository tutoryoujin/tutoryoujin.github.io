import type { Deck } from "../types";

const deck: Deck = {
  id: "emotions",
  title: { ko: "감정", en: "Emotions" },
  emoji: "😊",
  cover: "haengbokhaeyo",
  color: "blue",                 // 홈 더미에서 이 덱의 색
  unit: { ko: "감정 표현", en: "emotion expressions" },
  art: "icon",
  groups: {
    joy:   { ko: "기쁨",   en: "Joy",   color: "yellow" },
    love:  { ko: "설렘",   en: "Love",  color: "pink" },
    calm:  { ko: "편안",   en: "Calm",  color: "mint" },
    sad:   { ko: "슬픔",   en: "Sad",   color: "blue" },
    anger: { ko: "화",     en: "Anger", color: "coral" },
    fear:  { ko: "두려움", en: "Fear",  color: "lavender" }
  },
  cards: [
    { id: "gippeoyo",        emoji: "😄", ko: "기뻐요",     en: "I’m glad",                    note: "Joy about something that happened.", group: "joy" },
    { id: "haengbokhaeyo",   emoji: "🥰", ko: "행복해요",   en: "I’m happy",                   note: "A deeper, lasting kind of happiness.", group: "joy" },
    { id: "joayo",           emoji: "😊", ko: "좋아요",     en: "I like it / It’s good",       note: "The all-purpose “good” feeling.", group: "joy" },
    { id: "ppudeuthaeyo",    emoji: "🏅", ko: "뿌듯해요",   en: "I feel proud",                note: "Satisfied with something you did.", group: "joy" },
    { id: "seolleyo",        emoji: "🦋", ko: "설레요",     en: "I’m excited (fluttery)",      note: "Sweet anticipation, like before a date or a trip.", group: "love" },
    { id: "dugeungeoryeoyo", emoji: "💓", ko: "두근거려요", en: "My heart is pounding",        note: "From excitement, love, or nerves.", group: "love" },
    { id: "gamdong",         emoji: "🥹", ko: "감동이에요", en: "I’m touched / moved",         note: "When kindness or a story moves you.", group: "love" },
    { id: "pyeonanhaeyo",    emoji: "😌", ko: "편안해요",   en: "I feel at ease",              note: "Calm, comfortable, relaxed.", group: "calm" },
    { id: "seulpeoyo",       emoji: "😢", ko: "슬퍼요",     en: "I’m sad",                     note: "General sadness.", group: "sad" },
    { id: "oerowoyo",        emoji: "🥺", ko: "외로워요",   en: "I’m lonely",                  note: "Missing people, feeling alone.", group: "sad" },
    { id: "sseulsseulhaeyo", emoji: "🍂", ko: "쓸쓸해요",   en: "I feel desolate / empty",     note: "A quiet, empty feeling — often about a place or season.", group: "sad" },
    { id: "seopseophaeyo",   emoji: "😞", ko: "섭섭해요",   en: "I feel let down",             note: "Hurt because someone didn’t do what you hoped.", group: "sad" },
    { id: "uulhaeyo",        emoji: "☁️", ko: "우울해요",   en: "I feel down / depressed",     note: "A heavy, gloomy mood.", group: "sad" },
    { id: "hwanayo",         emoji: "😠", ko: "화나요",     en: "I’m angry",                   note: "Clear, strong anger.", group: "anger" },
    { id: "jjajeungnayo",    emoji: "😤", ko: "짜증나요",   en: "I’m annoyed",                 note: "Irritated by small things.", group: "anger" },
    { id: "dapdaphaeyo",     emoji: "😮‍💨", ko: "답답해요", en: "I feel frustrated / stifled", note: "When things are stuck or you can’t get through.", group: "anger" },
    { id: "museowoyo",       emoji: "😱", ko: "무서워요",   en: "I’m scared",                  note: "Fear of something.", group: "fear" },
    { id: "geokjeongdwaeyo", emoji: "😟", ko: "걱정돼요",   en: "I’m worried",                 note: "Anxious about what might happen.", group: "fear" },
    { id: "ginjangdwaeyo",   emoji: "😬", ko: "긴장돼요",   en: "I’m nervous",                 note: "Before a test, interview, or speech.", group: "fear" },
    { id: "bukkeureowoyo",   emoji: "😳", ko: "부끄러워요", en: "I’m shy / embarrassed",       note: "Bashful, a little embarrassed.", group: "fear" }
  ]
};

export default deck;
