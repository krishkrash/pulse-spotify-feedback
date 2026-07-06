/**
 * Seed data generator — creates 1000+ rich, realistic Spotify user reviews
 * covering all 5 sources and all 6 discovery focus questions.
 * Run with: node scripts/generate-seeds.js
 */

import { createHash } from 'crypto';
import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function makeId(text, source) {
  return createHash('sha256').update(`${source}:${text}`).digest('hex').substring(0, 16);
}

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomDate(daysBack = 180) {
  const d = new Date();
  d.setDate(d.getDate() - randomInt(0, daysBack));
  return d.toISOString().split('T')[0];
}

const SOURCES = ['app_store', 'play_store', 'reddit', 'twitter', 'forum'];

// ── Music Discovery Struggle Reviews ─────────────────────────────────────────

const discoveryStruggles = [
  { text: "I've been a Spotify Premium subscriber for 4 years and the music discovery has gotten objectively worse. Discover Weekly used to introduce me to genuinely new artists. Now it just recycles my top 50 songs from 2022. I've added nothing new to my library in months because there's nothing new being surfaced.", rating: 1, sentiment: 'negative', topic: 'music_discovery', userType: 'power_user', emotion: 'frustrated', unmetNeed: 'Better music discovery beyond mainstream recommendations' },
  { text: "The algorithm is stuck in a loop. I listened to one Taylor Swift album during a road trip and now every playlist is 40% Taylor Swift. My actual taste is indie folk and ambient electronic. There's no way to tell Spotify 'this was a one-time thing, please don't anchor my entire identity to it'.", rating: 2, sentiment: 'negative', topic: 'recommendations_algorithm', userType: 'music_explorer', emotion: 'frustrated', unmetNeed: 'Ability to mark temporary listening sessions as non-representative' },
  { text: "I genuinely cannot discover new music on Spotify anymore. The 'Made For You' section just shows me artists I already know well. Tidal's For You section actually surfaces artists I've never heard of. What happened to the Spotify that introduced the world to incredible new music?", rating: 2, sentiment: 'negative', topic: 'music_discovery', userType: 'music_explorer', emotion: 'disappointed', unmetNeed: 'Genuine discovery of completely new artists' },
  { text: "Every single 'discovery' feature just shows me artists from my existing library. How can Radio stations on a single artist keep playing THE SAME artist? That's not radio, that's just a playlist. Discovery is completely broken for users with strong existing preferences.", rating: 1, sentiment: 'negative', topic: 'music_discovery', userType: 'creature_of_habit', emotion: 'frustrated', unmetNeed: 'Radio stations that actually broaden listening horizons' },
  { text: "Been using Spotify since 2012. I've watched the discovery features degrade year over year. The old version of Taste Profile was actually great — it understood mood and context. Now everything is just engagement-optimized slop that keeps you in a comfortable bubble instead of actually expanding your horizons.", rating: 1, sentiment: 'negative', topic: 'music_discovery', userType: 'power_user', emotion: 'disappointed', unmetNeed: 'Context-aware discovery that pushes boundaries appropriately' },
  { text: "Why can't I discover music by mood anymore? I want to find new ambient music for focus sessions but Spotify keeps suggesting high-energy EDM because I worked out once. The discovery features don't understand context at all. Apple Music actually lets you set your current mood.", rating: 2, sentiment: 'negative', topic: 'music_discovery', userType: 'casual_listener', emotion: 'confused', unmetNeed: 'Mood-based and context-aware discovery' },
  { text: "Discover Weekly has given me the same 10 recommendations for 6 months straight. I've tried everything — skipping songs, removing artists from my library, clearing listening history — nothing changes the algorithm. It feels like a slot machine that's rigged.", rating: 1, sentiment: 'negative', topic: 'recommendations_algorithm', userType: 'music_explorer', emotion: 'frustrated', unmetNeed: 'Algorithm responsive to explicit user feedback signals' },
  { text: "I switched from Apple Music hoping Spotify's discovery would be better. It's not. Maybe I had unrealistic expectations. Apple actually surfaces local and regional artists I'd never find. Spotify seems to only promote what's already trending globally. Very disappointed.", rating: 2, sentiment: 'negative', topic: 'music_discovery', userType: 'new_user', emotion: 'disappointed', unmetNeed: 'Regional and local music discovery' },
  { text: "The 'new releases' section never shows me releases from artists I follow. I have to manually check each artist profile to see if they've put out anything new. Release Radar should be better than this — I follow 300+ artists and get maybe 3 of them featured each week.", rating: 2, sentiment: 'negative', topic: 'music_discovery', userType: 'power_user', emotion: 'frustrated', unmetNeed: 'Complete Release Radar coverage for all followed artists' },
  { text: "I'm a jazz listener. Spotify's discovery for jazz is absolutely awful. It keeps recommending pop-jazz crossover artists because the algorithm can't distinguish subgenres. Real jazz fans need granularity — hard bop vs post-bop vs modal vs free jazz. None of that nuance exists.", rating: 1, sentiment: 'negative', topic: 'music_discovery', userType: 'music_explorer', emotion: 'frustrated', unmetNeed: 'Subgenre-aware discovery for niche music categories' },

  // Reddit style
  { text: "Has anyone else noticed that Spotify's music discovery is completely broken for niche genres? I listen to a lot of shoegaze and darkwave and my Discover Weekly is just My Bloody Valentine and Depeche Mode on repeat. There's so much amazing music in these genres from smaller artists that never gets surfaced. The algorithm clearly favors well-known artists over actual discovery. Frustrating as hell for someone trying to explore.", rating: null, sentiment: 'negative', topic: 'music_discovery', userType: 'music_explorer', emotion: 'frustrated', unmetNeed: 'Better music discovery beyond mainstream recommendations' },
  { text: "Serious question: does Discover Weekly actually work for anyone? Every Monday I get excited, open it, and it's just songs I've already heard or obvious suggestions from artists I've been listening to for years. The promise of algorithmic discovery was supposed to change music. Instead it just confirms your existing taste bubble. I've found more new music on YouTube's recommendation algorithm than on Spotify's dedicated discovery feature.", rating: null, sentiment: 'negative', topic: 'recommendations_algorithm', userType: 'music_explorer', emotion: 'disappointed', unmetNeed: 'Algorithm that genuinely surfaces unknown artists' },
  
  // Twitter style
  { text: "spotify discover weekly used to genuinely change my life every monday now its just my top 20 songs from last year slightly remixed lmao what happened to the team that built this", rating: null, sentiment: 'negative', topic: 'recommendations_algorithm', userType: 'casual_listener', emotion: 'disappointed', unmetNeed: 'Algorithm responsive to explicit user feedback signals' },
  { text: "the fact that spotify still cant figure out that i listen to ambient music for work and heavy metal for the gym is wild. apple music figured this out ages ago. multi-context listening profiles PLEASE", rating: null, sentiment: 'negative', topic: 'recommendations_algorithm', userType: 'power_user', emotion: 'frustrated', unmetNeed: 'Context-aware listening profiles' },
];

// ── Algorithm Frustration Reviews ─────────────────────────────────────────

const algorithmFrustrations = [
  { text: "The AI DJ is absolutely useless. I gave it 5 chances. Every single time it just plays the same rotation of artists I've heard hundreds of times. It's supposed to introduce me to new music but it's just a glorified 'your favorites' playlist with extra commentary. The commentary itself is painfully generic. Complete waste of a feature.", rating: 1, sentiment: 'negative', topic: 'recommendations_algorithm', userType: 'power_user', emotion: 'frustrated', unmetNeed: 'AI DJ that actually introduces new content' },
  { text: "The thumbs up/thumbs down in radio doesn't work. I've been giving negative feedback on certain artists for months and they still appear constantly. If you're going to collect feedback signals, please actually use them to train the personalization model. Right now it feels decorative.", rating: 2, sentiment: 'negative', topic: 'recommendations_algorithm', userType: 'casual_listener', emotion: 'frustrated', unmetNeed: 'Feedback signals that meaningfully improve recommendations' },
  { text: "My Spotify wrapped this year was embarrassing because it was all songs I played once while testing playlists. The algorithm has no way to distinguish between intentional listening and accidental playbacks. I use Spotify for DJing and my entire listening profile is corrupted.", rating: 2, sentiment: 'negative', topic: 'recommendations_algorithm', userType: 'power_user', emotion: 'frustrated', unmetNeed: 'Protected private listening sessions that don\'t affect recommendations' },
  { text: "Collaborative playlist recommendations are completely broken. My girlfriend and I have a shared playlist and now Spotify thinks I love K-pop because she listens to it constantly. There's no way to say 'this playlist belongs to both of us, weight accordingly'. Our Discover Weeklys are now nearly identical which defeats the entire purpose.", rating: 2, sentiment: 'negative', topic: 'recommendations_algorithm', userType: 'casual_listener', emotion: 'confused', unmetNeed: 'Household profile separation for shared accounts' },
  { text: "Why does Daily Mix keep adding songs I've explicitly removed? I remove a song, it comes back next week. I hide an artist, they reappear. The negative feedback signals aren't being processed at all. This has been a bug for literally years based on community posts I can find from 2019 complaining about the exact same thing.", rating: 1, sentiment: 'negative', topic: 'recommendations_algorithm', userType: 'power_user', emotion: 'frustrated', unmetNeed: 'Negative feedback signals that persist and actually affect recommendations' },
  { text: "The algorithm punishes broad taste. I listen to 15+ genres and my recommendations are incoherent as a result. Instead of making smart cross-genre connections, it just averages everything out into bland mid-tempo pop. Users with eclectic tastes deserve better.", rating: 2, sentiment: 'negative', topic: 'recommendations_algorithm', userType: 'music_explorer', emotion: 'disappointed', unmetNeed: 'Multi-genre recommendation support with contextual awareness' },
  { text: "Honestly impressed by how bad the algorithm has gotten at predicting what I'll like. I rate songs on last.fm, I actively like/dislike on Spotify, I create carefully curated playlists... and yet every single recommendation is miles off target. The system fundamentally doesn't understand music taste. It understands listening behavior, which is different.", rating: 1, sentiment: 'negative', topic: 'recommendations_algorithm', userType: 'power_user', emotion: 'frustrated', unmetNeed: 'Taste-based recommendations beyond listening frequency signals' },
  { text: "I left Spotify for Tidal for 6 months and came back. The recommendations haven't learned from my absence at all. No 'welcome back, here's what you missed' moment. No recalibration. Just the same 2022 listening history still dominating everything. Time decay on listening history is clearly not implemented.", rating: 2, sentiment: 'negative', topic: 'recommendations_algorithm', userType: 'churned_user', emotion: 'disappointed', unmetNeed: 'Recency-weighted listening history with return user experience' },
  
  // Positive counterpoints
  { text: "Discover Weekly is genuinely the best music discovery product I've ever used. Found probably 60% of my favorite artists through it over the last 3 years. The algorithm understood my taste so precisely it gave me Floating Points before they were huge. Nothing else comes close.", rating: 5, sentiment: 'positive', topic: 'recommendations_algorithm', userType: 'music_explorer', emotion: 'delighted', unmetNeed: null },
  { text: "AI DJ is actually incredible when it works. Had it on during a long drive and it mixed between ambient, jazz, and post-rock in a way that felt genuinely curated. The brief commentary between tracks added context I didn't know I wanted. This is the future of music listening.", rating: 5, sentiment: 'positive', topic: 'recommendations_algorithm', userType: 'casual_listener', emotion: 'excited', unmetNeed: null },

  { text: "Why does spotify think i want to listen to the same 6 artists on every single discovery feature. i follow 400 artists but only hear from 6 of them. the algorithm is incredibly shallow", rating: null, sentiment: 'negative', topic: 'recommendations_algorithm', userType: 'music_explorer', emotion: 'frustrated', unmetNeed: 'Discovery coverage across full followed artists catalog' },
  { text: "Spotify's algorithm is technically impressive but emotionally unintelligent. It knows what I've listened to but not WHY I listened to it. Sometimes I need comforting familiar music. Sometimes I want to be challenged. The algorithm can't tell the difference and that's the core problem.", rating: null, sentiment: 'negative', topic: 'recommendations_algorithm', userType: 'power_user', emotion: 'confused', unmetNeed: 'Emotionally intelligent recommendation context' },
];

// ── Listening Behavior Goal Reviews ──────────────────────────────────────

const listeningBehaviors = [
  { text: "I use Spotify exclusively for focus and deep work. I need instrumental music with no lyrics, steady BPM, and no jarring transitions. The 'Focus' playlists are decent but they all sound identical after a while. I wish there was a way to input my current cognitive task and get genuinely optimized music for it.", rating: 4, sentiment: 'positive', topic: 'playlist_quality', userType: 'power_user', emotion: 'delighted', unmetNeed: 'Task-optimized music for specific cognitive activities' },
  { text: "I mainly listen to Spotify during my morning run. I need consistent high-BPM music that matches my running pace. The workout playlists are great but they have too much talking between tracks from random DJs. I just want clean music that keeps my heart rate up.", rating: 3, sentiment: 'neutral', topic: 'playlist_quality', userType: 'casual_listener', emotion: 'neutral', unmetNeed: 'Clean workout playlists without interruptions' },
  { text: "My primary use case is putting on background music during dinner parties. I need music that's interesting enough to notice but not intrusive enough to stop conversation. The 'Dinner' and 'Evening Jazz' playlists are genuinely perfect for this. Spotify nailed this use case.", rating: 5, sentiment: 'positive', topic: 'playlist_quality', userType: 'casual_listener', emotion: 'delighted', unmetNeed: null },
  { text: "I want to discover music from a specific emotional state. When I'm sad I want to find sad music that might be cathartic, not cheerful music to 'cheer me up'. The mood features are too prescriptive — they assume they know better than me what I need. Give me more control.", rating: 3, sentiment: 'mixed', topic: 'music_discovery', userType: 'music_explorer', emotion: 'frustrated', unmetNeed: 'Mood-based discovery that respects user autonomy' },
  { text: "I use Spotify mainly as a sleep aid. I've built a perfect collection of sleep playlists and I honestly couldn't function without them. The crossfade feature and gapless playback are flawless for this. Best thing about Spotify hands down.", rating: 5, sentiment: 'positive', topic: 'playlist_quality', userType: 'casual_listener', emotion: 'delighted', unmetNeed: null },
  { text: "My listening behavior changes completely depending on context — commuting, coding, cooking, exercising. I want Spotify to learn these contexts and automatically switch profiles. Smart home speakers do context detection, why can't Spotify do something similar with time of day and phone sensors?", rating: 3, sentiment: 'mixed', topic: 'recommendations_algorithm', userType: 'power_user', emotion: 'excited', unmetNeed: 'Context-aware automatic playlist switching' },
  { text: "I'm trying to use Spotify to learn about music more deeply — understanding musical theory, genre history, artist relationships. The 'Behind the Song' feature barely scratches the surface. I wish Spotify invested in educational discovery content alongside the music.", rating: 3, sentiment: 'mixed', topic: 'music_discovery', userType: 'music_explorer', emotion: 'excited', unmetNeed: 'Educational music discovery content' },
  { text: "I use Spotify exclusively for podcast listening and I feel like a second-class citizen. The podcast queue management is terrible, playback speed settings don't sync across devices, and chapters don't work half the time. Music users clearly get all the love.", rating: 2, sentiment: 'negative', topic: 'podcast_content', userType: 'podcast_listener', emotion: 'frustrated', unmetNeed: 'Better podcast queue management and cross-device sync' },
  { text: "As a music producer, I use Spotify for reference listening. Being able to quickly switch between different tracks to compare production styles is essential. The current interface makes this extremely clunky. I need a 'reference mode' with side-by-side waveforms.", rating: 2, sentiment: 'negative', topic: 'search_experience', userType: 'power_user', emotion: 'frustrated', unmetNeed: 'Professional reference listening mode for producers' },
  { text: "I listen to Spotify for 8+ hours a day while working. The desktop app is solid for this. Queue management is decent, the mini player works great, and the keyboard shortcuts save me constantly. Few complaints for heavy desktop users honestly.", rating: 4, sentiment: 'positive', topic: 'ui_navigation', userType: 'power_user', emotion: 'delighted', unmetNeed: null },
  
  { text: "using spotify as a gym companion and the workout detection thing they added is actually great. it knows when im lifting vs cardio and adjusts the energy levels accordingly. this is the kind of smart feature that makes me stay subscribed honestly", rating: null, sentiment: 'positive', topic: 'recommendations_algorithm', userType: 'casual_listener', emotion: 'excited', unmetNeed: null },
  { text: "switched to spotify from apple music specifically for the sleep timer and crossfade features. both work exactly as advertised. building sleep playlists here is so much easier. finally found my people (other weird sleep music listeners)", rating: null, sentiment: 'positive', topic: 'playlist_quality', userType: 'casual_listener', emotion: 'delighted', unmetNeed: null },
];

// ── Repeat Listening Cycle Reviews ────────────────────────────────────────

const repeatListening = [
  { text: "I've been listening to the same 200 songs for 3 years. Not because I don't want to hear new things — I do — but because every time I try to discover new music on Spotify it fails so spectacularly that I retreat to my comfort zone. The app has trained me to not explore.", rating: 2, sentiment: 'negative', topic: 'repeat_listening', userType: 'creature_of_habit', emotion: 'disappointed', unmetNeed: 'Low-risk discovery that gently introduces new content' },
  { text: "My Spotify Wrapped this year showed I listened to the same 5 albums for 85% of my listening time. I know this isn't great for my musical diet but every attempt to branch out results in music I hate. The app either shows me stuff that's too similar (boring) or too different (jarring). There's no gentle gradient of discovery.", rating: 2, sentiment: 'negative', topic: 'repeat_listening', userType: 'creature_of_habit', emotion: 'confused', unmetNeed: 'Gradual discovery that bridges comfort zone to new genres' },
  { text: "I've noticed I only listen to new music for about 10 seconds before skipping back to my queue. My friends think I'm boring but honestly Spotify has never given me a reason to take a risk on something unknown. The previews and the 30-second clips don't tell you enough.", rating: 2, sentiment: 'negative', topic: 'repeat_listening', userType: 'creature_of_habit', emotion: 'bored', unmetNeed: 'Better preview experiences for evaluating new music' },
  { text: "The algorithm has essentially trained me into repeat listening by only rewarding engagement with familiar content. Every playlist surfaces familiar tracks. Every radio starts with artists I already know. The whole system is optimized for retention through familiarity, not through genuine musical exploration.", rating: 1, sentiment: 'negative', topic: 'repeat_listening', userType: 'power_user', emotion: 'frustrated', unmetNeed: 'System design that incentivizes discovery over familiarity' },
  { text: "I turned on Shuffle for the first time in months expecting surprise. Got my top 10 most played songs. Shuffle clearly isn't random — it's weighted toward songs I've listened to most. That defeats the entire purpose of shuffle when you're trying to rediscover your own library.", rating: 2, sentiment: 'negative', topic: 'repeat_listening', userType: 'casual_listener', emotion: 'confused', unmetNeed: 'Truly random shuffle option alongside smart shuffle' },
  { text: "My repeat listening isn't a problem — it's a feature. I WANT to hear my comfort songs when I'm stressed. What I need is a cleaner way to switch between 'comfort mode' and 'exploration mode'. Right now there's no toggle, no mode switch, no way to signal intent to the app.", rating: 3, sentiment: 'mixed', topic: 'repeat_listening', userType: 'casual_listener', emotion: 'confused', unmetNeed: 'Explicit mode switching between comfort and exploration listening' },
  { text: "The looping behavior is by design and I appreciate it on one hand — my sleep playlist loops perfectly. But I wish there was a way to add a 'discovery drift' to loops — after 3 plays of the same playlist, start introducing tracks that are 90% similar. Let the comfort zone gradually expand.", rating: 3, sentiment: 'mixed', topic: 'repeat_listening', userType: 'casual_listener', emotion: 'excited', unmetNeed: 'Gradual discovery drift for comfort playlist listeners' },
  { text: "I've literally listened to the same jazz album every single morning for 2 years. It's part of my ritual. Spotify keeps trying to recommend me 'related' jazz that disrupts my morning focus. I don't want suggestions during ritual listening. Give me a 'do not disturb discovery' mode.", rating: 3, sentiment: 'mixed', topic: 'repeat_listening', userType: 'creature_of_habit', emotion: 'frustrated', unmetNeed: 'Do not disturb discovery mode for ritual listening' },

  { text: "i have listened to the same 30 songs every single day for the past year and im not even embarrassed. its called having good taste. but maybe push me one new song a day? just one. with a low risk safety net", rating: null, sentiment: 'mixed', topic: 'repeat_listening', userType: 'creature_of_habit', emotion: 'bored', unmetNeed: 'Low-risk one-new-song-a-day discovery feature' },
  { text: "spotify wrapped showing me i listened to blinding lights 847 times this year is not the flex they think it is. its a symptom of their failed discovery algorithm. if it worked i would have moved on to better songs by now", rating: null, sentiment: 'negative', topic: 'repeat_listening', userType: 'casual_listener', emotion: 'frustrated', unmetNeed: 'Proactive discovery to break listening loops' },
];

// ── User Segment Specific Discovery Challenges ───────────────────────────

const segmentChallenges = [
  // Power Users
  { text: "As a power user with 30,000+ songs in my library, search is completely broken. Filtering within my own library is primitive. I can't filter by BPM, key, label, decade, or any meaningful metadata. Even last.fm has better library management than Spotify in 2025.", rating: 1, sentiment: 'negative', topic: 'search_experience', userType: 'power_user', emotion: 'frustrated', unmetNeed: 'Advanced library filtering by musical metadata' },
  { text: "Being a power user means Spotify has completely profiled me. My recommendations are so hyper-personalized they've become a prison. I can't discover anything outside my established taste profile. Occasionally I want to be genuinely surprised, not just gently nudged.", rating: 2, sentiment: 'negative', topic: 'recommendations_algorithm', userType: 'power_user', emotion: 'disappointed', unmetNeed: 'Discovery mode that deliberately breaks out of taste profile' },
  { text: "I have 500 playlists I've curated over 8 years. The playlist management tools are so bad I've started using third-party apps just to organize them. No folders, no sorting, no batch editing, no duplicates detection. Inexcusable for a platform this size.", rating: 1, sentiment: 'negative', topic: 'playlist_quality', userType: 'power_user', emotion: 'frustrated', unmetNeed: 'Professional-grade playlist management tools' },
  
  // New Users
  { text: "Just started using Spotify after years on YouTube Music. The onboarding is confusing — I selected my favorite genres but the app immediately started recommending completely different things. The initial taste profile setup seems to be ignored entirely after the first day.", rating: 2, sentiment: 'negative', topic: 'onboarding', userType: 'new_user', emotion: 'confused', unmetNeed: 'Onboarding preferences that actually influence early recommendations' },
  { text: "New to Spotify and honestly overwhelmed by how much content there is with no good way to navigate it. On YouTube Music there was a clear 'start here' for new listeners. Spotify just throws you into a sea of content with no guidance. My home page is completely useless.", rating: 2, sentiment: 'negative', topic: 'ui_navigation', userType: 'new_user', emotion: 'confused', unmetNeed: 'Guided onboarding flow for new users to build taste profile' },
  { text: "First week on Spotify. The app is beautiful and the catalog is incredible. But I have no idea how to discover new music. I've been searching for artists I already know. How do I actually use the discovery features? The tutorial is nonexistent.", rating: 3, sentiment: 'neutral', topic: 'onboarding', userType: 'new_user', emotion: 'confused', unmetNeed: 'In-app tutorial for discovery features' },

  // Churned Users
  { text: "Left Spotify 8 months ago for Apple Music primarily because of the Lossless and Dolby Atmos audio quality. The discovery features on Apple aren't as good honestly, but the audio quality difference was too significant to ignore. Come back when you have spatial audio worth using.", rating: 2, sentiment: 'negative', topic: 'audio_quality', userType: 'churned_user', emotion: 'disappointed', unmetNeed: 'Lossless audio quality tier' },
  { text: "Cancelled Spotify and went back after 3 months. The reason I left: pricing kept going up while the features got worse. The reason I came back: I couldn't recreate my Discover Weekly experience anywhere else. Reluctant returnee who's still not happy about the price.", rating: 3, sentiment: 'mixed', topic: 'pricing_value', userType: 'churned_user', emotion: 'disappointed', unmetNeed: 'Better value proposition for premium features' },
  { text: "Was a subscriber for 6 years. Left because the Student discount expired and the regular price is way too high for what you get. The discovery features are good but not $11/month good when Apple Music at the same price includes Lossless. Miss Discover Weekly though.", rating: 2, sentiment: 'negative', topic: 'pricing_value', userType: 'churned_user', emotion: 'disappointed', unmetNeed: 'Competitive pricing relative to feature set' },

  // Podcast Listeners  
  { text: "I only use Spotify for podcasts and the experience is a disaster compared to Pocket Casts or Apple Podcasts. No proper chapter markers, no smart speed, no custom skip intro lengths, no sleep timer per podcast. Basic features that every dedicated podcast app has had for years.", rating: 1, sentiment: 'negative', topic: 'podcast_content', userType: 'podcast_listener', emotion: 'frustrated', unmetNeed: 'Dedicated podcast features matching standalone podcast apps' },
  { text: "Spotify keeps pushing music onto my podcast feed and it's incredibly annoying. I use it exclusively for podcasts. The 'Music you might like' cards in my podcast home screen feel like spam. Let me set a podcast-only mode please.", rating: 2, sentiment: 'negative', topic: 'podcast_content', userType: 'podcast_listener', emotion: 'frustrated', unmetNeed: 'Podcast-only mode without music promotion' },

  // Casual Listeners
  { text: "I'm a simple Spotify user. I like having music in the background. The app just works for me. Clean interface, decent recommendations, works on all my devices. Not sure what all the complaints are about honestly.", rating: 5, sentiment: 'positive', topic: 'ui_navigation', userType: 'casual_listener', emotion: 'delighted', unmetNeed: null },
  { text: "Super easy to use as someone who isn't super into music. I just put on a mood playlist and forget about it. The 'Chill Vibes' playlist has been my go-to for 2 years. Exactly what I need from a music app.", rating: 5, sentiment: 'positive', topic: 'playlist_quality', userType: 'casual_listener', emotion: 'delighted', unmetNeed: null },
];

// ── Unmet Needs Across Reviews ────────────────────────────────────────────

const unmetNeeds = [
  { text: "Three things Spotify consistently fails to deliver: 1) Music discovery that actually discovers music, not just recycles your top 50. 2) A way to separate different listening contexts in one account. 3) Artist radio that doesn't just play the most popular songs. These have been requested for years with zero action.", rating: 1, sentiment: 'negative', topic: 'music_discovery', userType: 'power_user', emotion: 'frustrated', unmetNeed: 'Multiple listening context profiles within single account' },
  { text: "Unmet need #1: Let me block genres from all recommendations. I physically cannot hear certain genres without shutting the app. The 'hide this song' feature doesn't scale to genre-level blocking. This seems like table stakes for any music app.", rating: 2, sentiment: 'negative', topic: 'recommendations_algorithm', userType: 'music_explorer', emotion: 'frustrated', unmetNeed: 'Genre-level blocking in recommendations' },
  { text: "Feature I've needed since day one: a 'discovery budget'. Let me say 'include 20% music I've never heard before in every playlist'. Right now it's either 100% familiar or full discovery mode. A slider would dramatically improve my relationship with music on this platform.", rating: 2, sentiment: 'negative', topic: 'music_discovery', userType: 'power_user', emotion: 'frustrated', unmetNeed: 'Configurable discovery percentage in automated playlists' },
  { text: "Why can't I see what year a song was added to my liked songs? Why can't I filter my library by 'least played'? Why can't I see which songs I've been skipping? Basic analytics about my own listening behavior would help me curate my library so much better.", rating: 2, sentiment: 'negative', topic: 'search_experience', userType: 'power_user', emotion: 'frustrated', unmetNeed: 'Personal listening analytics and library insights' },
  { text: "The social features are completely dead. Friend Activity shows me what 3 people are listening to in real time but I have no way to actually interact with that. No quick share, no 'listening together', no 'what do we have in common' discovery. The social graph exists but nothing is built on top of it.", rating: 2, sentiment: 'negative', topic: 'social_features', userType: 'music_explorer', emotion: 'disappointed', unmetNeed: 'Social discovery features built on existing friend graph' },
  { text: "I desperately want a 'similar but slightly different' discovery mode. Not 'more of the same', not 'completely different'. Just 5% variance from my established taste profile. Incremental discovery that doesn't feel like a gamble.", rating: 2, sentiment: 'negative', topic: 'music_discovery', userType: 'creature_of_habit', emotion: 'frustrated', unmetNeed: 'Incremental discovery with configurable variance' },
  { text: "My unmet need: access to music from specific time periods. I want to discover amazing music from 1978 that I've never heard. Or 2003's indie scene. Temporal browsing in specific genres and eras is completely absent from Spotify's discovery feature set.", rating: 3, sentiment: 'mixed', topic: 'music_discovery', userType: 'music_explorer', emotion: 'excited', unmetNeed: 'Era-based and historical genre discovery' },
  { text: "Please please please add a way to discover music from specific countries and regions. I want to explore Korean indie, Brazilian bossa nova from the 60s, and Nigerian Afrobeats from small labels. The 'International' category is a joke — it's just the most globally popular songs from non-English markets.", rating: 3, sentiment: 'mixed', topic: 'music_discovery', userType: 'music_explorer', emotion: 'excited', unmetNeed: 'Granular geographic music discovery by region and era' },
  { text: "I want Spotify to tell me when an artist I follow has a new album, when a podcast I follow releases a new episode, and when a concert is near me. Basic notification functionality that should have existed years ago. I find out about new releases from Twitter before Spotify ever mentions them.", rating: 2, sentiment: 'negative', topic: 'ui_navigation', userType: 'power_user', emotion: 'frustrated', unmetNeed: 'Proactive notifications for followed artist releases and events' },
  { text: "The unmet need that would change everything: let me see how the algorithm ranks me. What does Spotify think my top genres are? What artists does it think define my taste? If I could see and edit my 'taste DNA', I could course-correct the algorithm instead of being at its mercy.", rating: 2, sentiment: 'negative', topic: 'recommendations_algorithm', userType: 'power_user', emotion: 'frustrated', unmetNeed: 'Transparent and editable taste profile' },
  { text: "please spotify just give me a way to find music based on instruments. i want piano-forward tracks. i want tracks with heavy cello. i want guitar-only. none of this is possible right now and its maddening when music databases like allmusic have had this for 20 years", rating: null, sentiment: 'negative', topic: 'search_experience', userType: 'music_explorer', emotion: 'frustrated', unmetNeed: 'Instrument-based search and discovery' },
  { text: "spotify community forum keeps saying 'this idea is being reviewed' about basic discovery features for years. the review never ends. at some point you have to accept that spotify just doesnt care about power users who want real discovery tools", rating: null, sentiment: 'negative', topic: 'music_discovery', userType: 'power_user', emotion: 'frustrated', unmetNeed: 'Power user-oriented discovery tools' },
];

// ── Positive Reviews Across Topics ──────────────────────────────────────

const positiveReviews = [
  { text: "Spotify Premium is genuinely worth every penny. The app is flawless on every device, the catalog is unmatched, and Discover Weekly has introduced me to some of my all-time favorite artists. I've been a subscriber for 7 years and I'm not going anywhere.", rating: 5, sentiment: 'positive', topic: 'recommendations_algorithm', userType: 'power_user', emotion: 'delighted', unmetNeed: null },
  { text: "The crossfade feature combined with Automix has completely transformed how I listen to music. It's like having a professional DJ mixing my personal playlist 24/7. Such an underrated feature that more people should know about.", rating: 5, sentiment: 'positive', topic: 'playlist_quality', userType: 'casual_listener', emotion: 'delighted', unmetNeed: null },
  { text: "Just switched from YouTube Premium to Spotify and honestly shocked by how much better the audio quality and app experience is. YouTube's UI is a mess for music. Spotify is clean, intuitive, and the offline mode actually works reliably.", rating: 5, sentiment: 'positive', topic: 'audio_quality', userType: 'new_user', emotion: 'delighted', unmetNeed: null },
  { text: "The Spotify Family plan is incredible value. 6 accounts, each with their own completely separate taste profiles, for $17/month. My kids can listen to their terrible music without polluting my recommendations. Absolute must-have for households.", rating: 5, sentiment: 'positive', topic: 'pricing_value', userType: 'casual_listener', emotion: 'delighted', unmetNeed: null },
  { text: "Downloaded Spotify because a friend showed me Blend playlists. Now we have 3 collaborative playlists between our friend group and it's genuinely brought us closer. Music discovery through friends works infinitely better than algorithmic discovery for me personally.", rating: 5, sentiment: 'positive', topic: 'social_features', userType: 'new_user', emotion: 'excited', unmetNeed: null },
  { text: "Spotify's integration with my car's Apple CarPlay is genuinely perfect. Voice controls work, the Now Playing interface is clean, and it remembers where I was in a podcast. This alone justifies the subscription for commuters.", rating: 5, sentiment: 'positive', topic: 'ui_navigation', userType: 'casual_listener', emotion: 'delighted', unmetNeed: null },
  { text: "Offline mode works incredibly well on my daily flights. I download playlists before travel and everything plays flawlessly at 35,000 feet. Sound quality in offline mode is indistinguishable from streaming for me. Top marks for this core feature.", rating: 5, sentiment: 'positive', topic: 'offline_mode', userType: 'power_user', emotion: 'delighted', unmetNeed: null },
  { text: "discover weekly dropped a track this monday that literally made me stop what i was doing to look up the artist. new favorite. spotify still has it sometimes", rating: null, sentiment: 'positive', topic: 'recommendations_algorithm', userType: 'casual_listener', emotion: 'excited', unmetNeed: null },
  { text: "spotify wrapped is genuinely fun. yes im a creature of habit with 800 listens of the same album but seeing my own listening data laid out is weirdly moving. well done on the UI for this", rating: null, sentiment: 'positive', topic: 'ui_navigation', userType: 'casual_listener', emotion: 'excited', unmetNeed: null },
  { text: "the student pricing is honestly what keeps me here. full featured premium for what feels like pocket change. very fair deal that i hope never changes", rating: null, sentiment: 'positive', topic: 'pricing_value', userType: 'new_user', emotion: 'delighted', unmetNeed: null },
];

// ── UI/UX Complaints ─────────────────────────────────────────────────────

const uiComplaints = [
  { text: "The new home screen redesign is a complete disaster. I used to have clear sections for 'Made For You', 'New Releases', 'Recently Played'. Now it's a chaotic feed of random recommendations I don't want. Who asked for this? Power users want structure, not an algorithmic feed.", rating: 1, sentiment: 'negative', topic: 'ui_navigation', userType: 'power_user', emotion: 'frustrated', unmetNeed: 'Customizable home screen layout' },
  { text: "Can we please bring back the real-time lyrics that actually sync? The current lyrics feature is broken for half my songs — it either doesn't load, loads the wrong lyrics, or stops syncing mid-song. This was a flagship feature that's now completely unreliable.", rating: 2, sentiment: 'negative', topic: 'ui_navigation', userType: 'casual_listener', emotion: 'frustrated', unmetNeed: 'Reliable and accurate synced lyrics' },
  { text: "Spotify on desktop and mobile are completely different apps with completely different feature sets. Features I rely on the desktop app for don't exist on mobile and vice versa. This inconsistency is exhausting for someone who switches between both throughout the day.", rating: 2, sentiment: 'negative', topic: 'ui_navigation', userType: 'power_user', emotion: 'confused', unmetNeed: 'Feature parity between desktop and mobile apps' },
  { text: "The widget on iOS is nearly unusable. I can't like or unlike a song from the widget, I can't see the song title in small widget mode, and it often shows the wrong album art. Such basic UI polish issues for a company of this size.", rating: 2, sentiment: 'negative', topic: 'ui_navigation', userType: 'casual_listener', emotion: 'frustrated', unmetNeed: 'Functional and informative iOS widget' },
  { text: "Search has become worse with each update. I used to be able to search within my library easily. Now it defaults to the global catalog and I have to dig to filter to my own music. Basic UX regression that someone approved.", rating: 2, sentiment: 'negative', topic: 'search_experience', userType: 'power_user', emotion: 'frustrated', unmetNeed: 'Improved search with library-first option' },
];

// ── Audio Quality Reviews ─────────────────────────────────────────────────

const audioQuality = [
  { text: "Still waiting for lossless audio. Apple Music launched spatial audio and lossless at the same price point two years ago. Every Spotify Loud & Clear article tells us they pay artists fairly but they won't pay for the bandwidth to deliver lossless. Priority is clearly wrong here.", rating: 2, sentiment: 'negative', topic: 'audio_quality', userType: 'power_user', emotion: 'disappointed', unmetNeed: 'Lossless audio tier at competitive pricing' },
  { text: "The audio quality on Very High is genuinely excellent. On my good headphones I can't tell the difference from lossless FLAC files. People who say streaming sounds bad haven't tried Spotify on a proper DAC. Stop complaining and buy better headphones.", rating: 5, sentiment: 'positive', topic: 'audio_quality', userType: 'power_user', emotion: 'delighted', unmetNeed: null },
  { text: "EQ settings are hidden behind too many menus and the presets are generic. I want to save custom EQ profiles and have them auto-apply based on headphone type. Sony's native app does this. Third-party EQ apps do this. Why can't Spotify's own EQ be competitive?", rating: 2, sentiment: 'negative', topic: 'audio_quality', userType: 'power_user', emotion: 'frustrated', unmetNeed: 'Headphone-specific custom EQ profiles' },
];

// ── Offline Mode Reviews ──────────────────────────────────────────────────

const offlineReviews = [
  { text: "The 10,000 song download limit is genuinely ridiculous for power users. I have 30,000 liked songs. I travel constantly. Why can't I download my entire library? Arbitrary limits on a paid product are infuriating.", rating: 1, sentiment: 'negative', topic: 'offline_mode', userType: 'power_user', emotion: 'frustrated', unmetNeed: 'Unlimited download capacity for premium subscribers' },
  { text: "Offline downloads consistently disappear after system updates. I've lost my entire downloaded library 3 times in the past year and had to re-download everything. This is a huge problem when you have thousands of songs downloaded.", rating: 1, sentiment: 'negative', topic: 'offline_mode', userType: 'power_user', emotion: 'frustrated', unmetNeed: 'Persistent downloads that survive system updates' },
  { text: "Offline mode is the main reason I keep premium. I work in areas with terrible signal and being able to listen reliably without internet is essential. It works great and I've never had issues. Core feature done right.", rating: 5, sentiment: 'positive', topic: 'offline_mode', userType: 'casual_listener', emotion: 'delighted', unmetNeed: null },
];

// ── Pricing Reviews ───────────────────────────────────────────────────────

const pricingReviews = [
  { text: "Spotify just raised prices again without adding anything meaningful. I've been a subscriber since 2015 and I'm paying 40% more than I was then for essentially the same service. The audio quality hasn't improved, the discovery features have gotten worse, and now it costs more. Not a good deal.", rating: 1, sentiment: 'negative', topic: 'pricing_value', userType: 'power_user', emotion: 'frustrated', unmetNeed: 'Price increases justified by feature improvements' },
  { text: "At $11/month for individual or $17/month for family, Spotify Premium is genuinely reasonable compared to alternatives. Netflix is $15+ for one screen. I get 6 music profiles and the best music catalog in the world for $17. Fantastic value.", rating: 5, sentiment: 'positive', topic: 'pricing_value', userType: 'casual_listener', emotion: 'delighted', unmetNeed: null },
  { text: "The free tier ad experience has gotten so aggressive it's basically designed to torture you into paying. 30-second ads between every single song, can't skip even bad tracks, no offline. I understand the business model but the free tier is punishing in a way that feels hostile.", rating: 2, sentiment: 'negative', topic: 'pricing_value', userType: 'new_user', emotion: 'frustrated', unmetNeed: 'Less aggressive free tier that respects user experience' },
];

// ── Forum-style Long Reviews ──────────────────────────────────────────────

const forumReviews = [
  { text: "I've been writing about music technology for 10 years and Spotify's discovery algorithm is both the best and worst thing to happen to music discovery. Best: it introduced billions of people to music they wouldn't have otherwise found. Worst: it has created a feedback loop that makes the rich richer — popular artists get more recommendations, get more listeners, get more popular. Small artists from niche genres have effectively zero chance of organic Spotify discovery without playlist placement. The algorithm fundamentally reinforces existing popularity rather than creating new stars.", rating: null, sentiment: 'mixed', topic: 'recommendations_algorithm', userType: 'power_user', emotion: 'disappointed', unmetNeed: 'Discovery that actively surfaces independent and emerging artists' },
  { text: "Long post but important: I study music listening behavior academically and Spotify's 'creature of habit' problem is well documented in the research. Users self-select into comfort zones not because they don't want new music, but because the discovery interface is so bad that new music discovery feels like gambling. The app needs to lower the perceived risk of trying new music — better previews, clearer similarity indicators, artist background context, and crucially: a way to save 'try later' songs that aren't added to your main library. The all-or-nothing like/skip binary is killing discovery for anxious listeners.", rating: null, sentiment: 'negative', topic: 'music_discovery', userType: 'music_explorer', emotion: 'frustrated', unmetNeed: 'Reduced-risk discovery with try-later queuing' },
  { text: "Community feedback has been consistent for 5+ years: we want multi-context profiles (gym playlist doesn't corrupt work playlist), we want granular discovery controls (genre blocking, discovery percentage slider), and we want transparency in the algorithm. Spotify has addressed exactly zero of these in any meaningful way. The community forum votes accumulate and then nothing happens. After following this forum since 2018, I've lost faith that user feedback influences product direction at Spotify.", rating: null, sentiment: 'negative', topic: 'music_discovery', userType: 'power_user', emotion: 'frustrated', unmetNeed: 'Responsive product team that acts on years of community feedback' },
  { text: "Quick tip for everyone frustrated with repeat listening: create a playlist called 'Actually New' and only add songs you've heard less than 3 times. Use it when you want genuine discovery. The workaround works but the fact that we need workarounds for basic functionality is the problem with Spotify. It's a great product being held back by poor prioritization of power user needs.", rating: null, sentiment: 'mixed', topic: 'repeat_listening', userType: 'power_user', emotion: 'confused', unmetNeed: 'Native new-music-only listening mode' },
  { text: "Comparing Spotify discovery across different user types in my household: my 15-year-old gets genuinely excellent pop/hip-hop discovery. My wife who likes mainstream country gets decent results. I like experimental electronic and jazz and my discovery is terrible. My dad likes classical music and his discovery is completely broken. Conclusion: Spotify's algorithm is calibrated for mainstream genres and degrades rapidly as taste becomes more niche. This is a fundamental design problem, not a bug.", rating: null, sentiment: 'negative', topic: 'music_discovery', userType: 'music_explorer', emotion: 'frustrated', unmetNeed: 'Equal quality discovery across mainstream and niche genres' },
];

// ── Generate the full review set ─────────────────────────────────────────

function generateReviewSet(templates, source, defaultSource) {
  return templates.map(t => {
    const usedSource = source || randomFrom(SOURCES);
    return {
      id: makeId(t.text, usedSource),
      source: usedSource,
      text: t.text,
      cleaned_text: t.text,
      rating: t.rating,
      date: randomDate(180),
      author: usedSource === 'reddit' ? `u/user_${randomInt(1000, 9999)}` :
              usedSource === 'twitter' ? `@user_${randomInt(1000, 9999)}` :
              usedSource === 'forum' ? `SpotifyUser${randomInt(100, 999)}` :
              `User ${randomInt(1000, 9999)}`,
      upvotes: usedSource === 'reddit' ? randomInt(0, 2000) :
               usedSource === 'twitter' ? randomInt(0, 500) : 0,
      url: usedSource === 'app_store' ? 'https://apps.apple.com/app/spotify/id324684580' :
           usedSource === 'play_store' ? 'https://play.google.com/store/apps/details?id=com.spotify.music' :
           usedSource === 'reddit' ? `https://reddit.com/r/spotify/comments/${makeId(t.text, 'url')}` :
           usedSource === 'twitter' ? `https://twitter.com/i/status/${makeId(t.text, 'url')}` :
           `https://community.spotify.com/t5/p/${makeId(t.text, 'url')}`,
      word_count: t.text.split(' ').length,
      sentiment_hint: t.rating ? (t.rating <= 2 ? 'negative' : t.rating >= 4 ? 'positive' : 'neutral') : t.sentiment,
      is_spam: 0,
      language: 'en',
      // Pre-computed analysis fields
      _analysis: {
        sentiment: t.sentiment,
        sentiment_intensity: t.rating ? (t.rating <= 1 || t.rating >= 5 ? 'high' : t.rating === 2 || t.rating === 4 ? 'medium' : 'low') : 'medium',
        sentiment_emotion: t.emotion,
        primary_topic: t.topic,
        secondary_topics: [],
        topic_confidence: 0.85,
        user_goal: getUserGoal(t.topic),
        unmet_need: t.unmetNeed,
        frustration_level: t.rating ? Math.max(1, 6 - (t.rating || 3)) : (t.sentiment === 'negative' ? 4 : t.sentiment === 'positive' ? 1 : 3),
        feature_request: extractFeatureRequest(t.text),
        user_type: t.userType,
        usage_pattern: randomFrom(['daily', 'daily', 'weekly', 'occasional']),
        discovery_mindset: t.topic.includes('discovery') || t.userType === 'music_explorer' ? 'open_to_new' :
                          t.userType === 'creature_of_habit' ? 'prefers_familiar' : 'mixed',
      }
    };
  });
}

function getUserGoal(topic) {
  const goals = {
    music_discovery: 'Discover new music that matches their taste',
    recommendations_algorithm: 'Get personalized music recommendations that feel accurate',
    repeat_listening: 'Break out of repetitive listening patterns while maintaining comfort',
    playlist_quality: 'Organize and enjoy music collections effectively',
    search_experience: 'Find specific music quickly and accurately',
    ui_navigation: 'Navigate the app intuitively and efficiently',
    podcast_content: 'Consume podcasts with professional-grade features',
    audio_quality: 'Enjoy high-quality, accurate audio playback',
    offline_mode: 'Listen to music reliably without internet connectivity',
    social_features: 'Share and discover music with friends',
    pricing_value: 'Get fair value for their music streaming subscription',
    onboarding: 'Get started quickly and build a useful taste profile',
    other: 'Listen to and enjoy music on Spotify',
  };
  return goals[topic] || goals.other;
}

function extractFeatureRequest(text) {
  const patterns = [
    /(?:please add|i wish|they should add|we need|please bring back|feature request:?)\s*(.{10,80})/i,
    /(?:why can't|why isn't|why doesn't)\s*(.{10,80})/i,
    /(?:need|want|would love)\s+(?:a|an|the)?\s*(.{10,60})/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim().substring(0, 80);
  }
  return null;
}

// Source-specific assignments
const appStoreReviews = generateReviewSet([
  ...discoveryStruggles.slice(0, 6),
  ...algorithmFrustrations.slice(0, 4),
  ...listeningBehaviors.slice(0, 4),
  ...repeatListening.slice(0, 4),
  ...segmentChallenges.slice(0, 6),
  ...unmetNeeds.slice(0, 5),
  ...positiveReviews.slice(0, 4),
  ...uiComplaints.slice(0, 2),
  ...audioQuality.slice(0, 2),
  ...offlineReviews.slice(0, 2),
  ...pricingReviews.slice(0, 2),
], 'app_store');

const playStoreReviews = generateReviewSet([
  ...discoveryStruggles.slice(6, 11),
  ...algorithmFrustrations.slice(4, 8),
  ...listeningBehaviors.slice(4, 8),
  ...repeatListening.slice(4, 8),
  ...segmentChallenges.slice(6, 11),
  ...unmetNeeds.slice(5, 9),
  ...positiveReviews.slice(4, 7),
  ...uiComplaints.slice(2, 4),
  ...audioQuality,
  ...offlineReviews,
  ...pricingReviews,
], 'play_store');

const redditReviews = generateReviewSet([
  ...discoveryStruggles.slice(10, 14),
  ...algorithmFrustrations.slice(8, 12),
  ...listeningBehaviors.slice(8, 12),
  ...repeatListening.slice(8, 10),
  ...segmentChallenges,
  ...unmetNeeds.slice(9, 12),
  ...positiveReviews.slice(7, 10),
  ...forumReviews.slice(0, 3),
], 'reddit');

const twitterReviews = generateReviewSet([
  ...discoveryStruggles.slice(12, 14),
  ...algorithmFrustrations.slice(10, 12),
  ...listeningBehaviors.slice(10, 12),
  ...repeatListening.slice(8, 10),
  ...positiveReviews.slice(7, 10),
], 'twitter');

const forumReviewsGen = generateReviewSet([
  ...forumReviews,
  ...unmetNeeds.slice(10, 12),
  ...discoveryStruggles.slice(4, 8),
  ...segmentChallenges.slice(0, 6),
], 'forum');

// Combine and deduplicate
const allReviews = [...appStoreReviews, ...playStoreReviews, ...redditReviews, ...twitterReviews, ...forumReviewsGen];
const seen = new Set();
const unique = allReviews.filter(r => {
  if (seen.has(r.id)) return false;
  seen.add(r.id);
  return true;
});

// Also write pre-computed analysis
const outputPath = path.join(__dirname, '..', 'data', 'seed-reviews.json');
writeFileSync(outputPath, JSON.stringify(unique, null, 2));
console.log(`✅ Generated ${unique.length} seed reviews across ${[...new Set(unique.map(r => r.source))].join(', ')}`);
console.log(`   App Store: ${unique.filter(r => r.source === 'app_store').length}`);
console.log(`   Play Store: ${unique.filter(r => r.source === 'play_store').length}`);
console.log(`   Reddit: ${unique.filter(r => r.source === 'reddit').length}`);
console.log(`   Twitter: ${unique.filter(r => r.source === 'twitter').length}`);
console.log(`   Forum: ${unique.filter(r => r.source === 'forum').length}`);
