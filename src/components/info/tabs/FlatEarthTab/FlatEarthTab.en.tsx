import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useLanguageFromPath } from '../../../../hooks/useLanguageFromPath';
const FlatEarthSimulator = lazy(() => import('./FlatEarthSimulator/FlatEarthSimulator'));

// Simple ErrorBoundary to catch Canvas/lazy mount failures
class ErrorBoundary extends React.Component<{ onRetry?: () => void; children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { onRetry?: () => void; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100%', color: '#fff', background: '#0b1020', flexDirection: 'column'
        }}>
          <div>An error occurred while loading the simulator.</div>
          <button onClick={this.props.onRetry} style={{ marginTop: 10 }}>Try Again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function FlatEarthTab() {
  const [reloadKey, setReloadKey] = useState(0);
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);
  const { currentLanguage } = useLanguageFromPath();

  // Check for mobile portrait orientation
  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.innerWidth <= 768; // Mobile breakpoint
      const isPortrait = window.innerHeight > window.innerWidth;
      setIsMobilePortrait(isMobile && isPortrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Preload the module to avoid lazy loading "cold start"
  useEffect(() => {
    import('./FlatEarthSimulator/FlatEarthSimulator').catch(() => {});
  }, []);

  return (
    <article>
      <h1>Exploring Earth Models: An Invitation to Observation</h1>

      <h2>Flat Earth Models - What They Explain... and What They Don't</h2>

      <p style={{ fontWeight: 'bold', backgroundColor: '#7a0000', color: '#ffffff', padding: '12px 16px', borderRadius: '6px', lineHeight: 1.5 }}>
        A flat Earth simulator is available further down on this page. But before using it, 
        please read the page to understand how to use it and why the simulator is at your disposal.</p>
      
      <h3>The Basic Model: The Earth-Disc</h3>
      <p>
        Some people cannot accept that the Earth is spherical. They think the Earth is flat, and how can we blame them? 
        When we look at our feet and spread our arms, that's what our senses tell us. 
        For these people, the Earth is like a large pancake. 
      </p>
      <p>
        The most widespread image of a flat Earth is presented like this: a flat disc with the North Pole at 
        the center (like the hub of a bicycle wheel) and Antarctica (the South Pole) forming a wall of ice 
        all around the edge (like the tire of this wheel).</p>
      
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', margin: '16px 0', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 360px', minWidth: '280px' }}>

        <p>In this model:</p>
          <ul style={{ marginRight: '0',}}>
            <li><strong>The Sun and Moon</strong> would be small balls (about 50 km in diameter) that orbit in circles above the earth, at about 5000 km altitude</li>
            <li><strong>Day and night</strong> are explained, in this model, because the Sun acts like a spotlight: it only illuminates a limited area of the disc</li>
            <li><strong>The seasons</strong> occur because the Sun changes circles: it orbits closer to the center in summer, and closer to the edge in winter</li>
            <li><strong>The stars</strong> would be attached (or would be small holes) on a dome that surrounds the earth</li>
          </ul>
        </div>
        <figure style={{ marginLeft: '0', marginRight: '5rem', flex: '0 0 320px', maxWidth: '420px' }}>
          <img
            src="/img/flatearth/fe.png"
            alt="Classic image of a flat earth"
            loading="lazy"
            style={{ width: '100%', height: 'auto', borderRadius: '8px', border: '1px solid #333' }}
          />
          <figcaption style={{ fontSize: '0.9em', color: '#aaa', marginTop: '6px' }}>
            <small>Most common flat Earth model.</small>
          </figcaption>
        </figure>
      </div>

      <h3>What Flat Earth Explains Somewhat</h3>
      <ul>
        <li><strong>The flat horizon</strong>: When you look at the ocean, it does indeed seem flat. But this model struggles to explain why we don't see the other shore of the ocean (for example Brazil from Africa, or London from the Eiffel Tower). Even with ultra-powerful telescopes, we don't see beyond the horizon.</li>
        <li><strong>Time zones</strong>: Different areas of the disc 
        are illuminated at different times. It can be day in New York and night 
        in Tokyo at the same time. This works "somewhat," but we'll see that it's not always as precise with a flat Earth as with a spherical Earth.</li>
        <li><strong>Shadows at noon</strong>: Shadows don't always have the same length depending on our position on Earth. This is something we've "known" for
         over 2000 years. It was in Egypt that Eratosthenes had already noticed that:
        <br/>- In Syene (now Aswan), in southern Egypt, the Sun was directly overhead on the summer solstice (June 21st) at noon — his stick cast no shadow at all
        <br/>- In Alexandria, 800 km further north, at the same time, objects cast a shadow that could be measured and used for geometry to calculate many things
        <br/>He therefore calculated that there could only be two possible geometries:
          <ul>
              <li> Either the Earth was spherical and the sun really very far away (millions of km)</li>
              <li> Or the Earth was flat and the sun was close (about 5000 km)</li>
            </ul>
            This is why "Flat Earthers" tell us the sun is 5000 km above us and "Sphericalists" tell us it's 150 million km away. In both cases, we can explain shadows.
         </li>
        
      </ul>
      
      <h2>Since When Do We Think the Earth is Spherical?</h2>
      
      <h3>The Ancient Greeks: The First Detectives</h3>
      
      <p><strong>Around 500 BC - Pythagoras</strong>: This mathematician (yes, the one from the theorem!) notices that ships disappear hull first on the horizon, then the sails. As if they were going down an invisible hill!</p>
      
      <p><strong>Around 350 BC - Aristotle</strong>: He compiles the evidence:</p>
      <ul>
        <li>The Earth's shadow on the Moon during eclipses is always round</li>
        <li>We see different stars when traveling north or south</li>
        <li>All celestial objects (Moon, planets) are spheres, why not Earth?</li>
      </ul>
      
      <p><strong>Around 240 BC - Eratosthenes</strong>: The champion! He calculates Earth's circumference with just sticks and shadows! In Syene (Aswan today), the Sun illuminates the bottom of wells at noon on the summer solstice. The same day in Alexandria, 800 km further north, objects cast a shadow. By measuring the angle of this shadow (7.2°), he calculates: 7.2° is 1/50 of a circle, so Earth is 50 × 800 = 40,000 km around. Bingo! That's the right answer!</p>
      
      <h3>The Middle Ages: We Never Believed the Earth Was Flat!</h3>
      
      <p><strong>Contrary to the myth</strong>, medieval scholars knew the Earth was round:</p>
      
      <p><strong>Bede the Venerable (673-735)</strong>: This English monk explains tides by the Moon's attraction and describes Earth as a sphere.</p>
      
      <p><strong>Al-Biruni (973-1048)</strong>: This Persian scholar recalculates Earth's radius and obtains 6339.6 km (the real one: 6371 km). Not bad for the time!</p>
      
      <p><strong>Thomas Aquinas (1225-1274)</strong>: The greatest medieval philosopher uses Earth's roundness as an example of obvious scientific truth.</p>
      
      <h3>The Great Explorations: Proof Through Travel</h3>
      
      <p><strong>1519-1522 - Magellan</strong>: His expedition makes the first complete trip around Earth. They leave westward and return from the east. </p>
      
      <p><strong>Navigators</strong>: All use stars to navigate. The height of the North Star above the horizon directly gives latitude (distance north of the equator). This only works on a sphere!</p>
      
      <h3>The Modern Era: Evidence Accumulates</h3>
      
      <p><strong>1851 - Foucault Pendulum</strong>: This giant pendulum shows Earth's rotation. It changes swing direction according to latitude. At the pole, it makes a complete turn in 24h. In Paris, in 32h. At the equator, it doesn't turn. Exactly what we expect from a rotating sphere!</p>
      
      <p><strong>Time zones</strong>: Created in 1884, they divide Earth into 24 slices. The Sun rises in the east and travels 15° per hour (360° ÷ 24h). This fits perfectly with a spherical Earth that rotates.</p>
      
      <h3>Today: Thousands of Independent Proofs</h3>
      <ul>
        <li><strong>Satellites</strong>: Several thousand active satellites (mega-constellations included), operated by dozens of countries</li>
        <li><strong>The ISS</strong>: Astronauts from 20 nations have visited it</li>
        <li><strong>GPS</strong>: Your phone uses orbiting satellites and relativistic corrections; this framework is incompatible with a flat Earth model without orbits</li>
        <li><strong>Airlines</strong>: They save millions in fuel thanks to "great circle" routes (the shortest path on a sphere)</li>
        <li><strong>Radio amateurs</strong>: Millions of enthusiasts communicate by bouncing waves off the ionosphere (atmospheric layer)</li>
      </ul>
      
      <p><strong>Chapter conclusion</strong>: So it's not "just NASA" that claims the Earth is spherical. It's all of humanity, for 2500 years, across all cultures, all countries, all eras!</p>
      
      <h2>What Flat Earth Doesn't Explain at All</h2>

      <p>To allow you to try all flat Earth hypotheses and possible settings, we offer you this <strong>flat Earth simulator</strong>:</p>

      <p>You can try all sorts of combinations of size, distance and lighting, and also choose the city from which you observe the sky.</p>
       
        {/* Container for simulator with fixed height */}
        <div 
          id="flat-earth-simulator"
          style={{ 
            width: '100%', 
            height: '520px', 
            position: 'relative',
            border: '2px solid #333',
            borderRadius: '10px',
            overflow: 'hidden',
            marginBottom: '20px',
            backgroundColor: '#0b1020', // stable dark background
          }}>
          {isMobilePortrait ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              fontSize: '18px',
              color: '#fff',
              background: '#0b1020',
              textAlign: 'center',
              padding: '20px',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ fontSize: '48px' }}>📱↻</div>
              <div>
                {currentLanguage === 'fr' 
                  ? 'Veuillez tourner votre appareil en mode paysage pour voir le simulateur'
                  : 'Please turn your device to landscape mode to see the simulator'
                }
              </div>
            </div>
          ) : (
            <ErrorBoundary onRetry={() => setReloadKey(k => k + 1)}>
              <Suspense fallback={
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                  fontSize: '20px',
                  color: '#fff',
                  background: '#0b1020',
                }}>
                  ⏳ Loading 3D simulator...
                </div>
              }>
                <FlatEarthSimulator key={reloadKey} />
              </Suspense>
            </ErrorBoundary>
          )}
        </div>
      

      <p>If you use this simulator and compare it with what you can observe in reality (or what the "spherical Earth" simulator in SpaceView gives you), you'll see that there are many things we can't explain on a flat Earth.</p>

      <h3>Sunset</h3>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', margin: '16px 0', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 360px', minWidth: '280px' }}>
          <p style={{ marginRight: 0}}>On a 
          spherical earth, we clearly see that the sun rises in the East and sets 
          in the West (sometimes a bit South, sometimes a bit North). On a flat earth, it's difficult to explain
          why the sun disappears below the horizon.
          The simulator shows us that if we were on a flat earth, no matter how we place the sun or from where we look,
          the sun should rotate in the sky coming from the Northeast to go to the Northwest. The simulator shows it, on a flat earth, in the afternoon,
          the sun would move away from us, appear smaller and smaller, get closer to the horizon
           (due to perspective), but would never touch the horizon.</p>
          <p style={{ marginRight: 0 }}>
            Moreover, in such a model, the Sun's apparent size should vary significantly throughout the day.
            Yet observations show a nearly constant size (~0.53°), which contradicts this scenario.
          </p>
        </div>
        <figure className="info-content-margins-right" style={{ marginTop : 0, flex: '0 0 320px', maxWidth: '420px' }}>
          <img
            src="/img/flatearth/fe-sun-to-north.png"
            alt="Expected Sun trajectory toward the north on a flat Earth model"
            loading="lazy"
            style={{ width: '100%', height: 'auto', borderRadius: '8px', border: '1px solid #333' }}
          />
          <figcaption style={{ fontSize: '0.9em', color: '#aaa', marginTop: '6px' }}>
            <small>On a flat Earth model, the Sun would move from northeast to northwest.</small>
          </figcaption>
        </figure>
      </div>

      <h3>Time Zones</h3>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', margin: '16px 0', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 360px', minWidth: '280px' }}>
          <p style={{ marginRight: 0}}>We saw that with the flat Earth model, we can explain why it can be day in one place and night in another place at the same time.
          <br/> But no matter how we "play" with the flat Earth simulator, change the sun's beam width, modify its orbit or height, we can't get it "just right."
          <br/>
          <br/> For example, 
          <br/> - On March 21st each year at 12:25, the sun is directly above Kisangani, a large city (almost) on the equator in the middle of Africa.
          <br/> - At the same time in New York, it's 6:25 AM and it's still dark.&nbsp;
          <br/> - At the same time in Porto Velho, Brazil, it's 6:25 AM and the sun has just risen.&nbsp;
          <br/>
          <a
            href='?tl=2i2o.t5d2ax&lp=5xc&l=3662762&t=stgybb&F=0&p=5&d=custom&k=1&f=3p&b=94vp&pl=n&sr=-82.675&pc=5128581.212730.3662762'
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            (spherical earth simulation)
          </a>
          </p>          
        </div>
        <figure className="info-content-margins-right" style={{ marginTop : 0, marginBottom : 0, flex: '0 0 320px', maxWidth: '420px' }}>
          <img
            src="/img/capture/capture-earth-noon-at-congo.png"
            alt="On a spherical earth half the planet is illuminated, and the other half is not"
            loading="lazy"
            style={{ width: '100%', height: 'auto', borderRadius: '8px', border: '1px solid #333' }}
          />
          <figcaption style={{ fontSize: '0.9em', color: '#aaa', marginTop: '6px' }}>
            <small>On a spherical earth, half the planet is illuminated, and the other half is not.</small>
          </figcaption>
        </figure>
      </div>

      <p >
        Well, with the flat Earth simulator, we have a lot of trouble finding a configuration where this works (in fact, we didn't manage it).
        <br/>We can see that if the sun is directly above Kisangani (in blue), it will illuminate New York (in red) well before illuminating Porto Velho (in green).
      </p>
        <figure className="info-content-margins" style={{ marginTop : 0, marginBottom : 0 }}>
          <img
            src="/img/flatearth/fe-noon-at-congo.png"
            alt="On a flat earth in March, the sun rises in New York before rising in eastern Brazil. In real life it's the opposite."
            loading="lazy"
            style={{ width: '100%', height: 'auto', borderRadius: '8px', border: '1px solid #333' }}
          />
          <figcaption style={{ fontSize: '0.9em', color: '#aaa', marginTop: '6px' }}>
            <small>On a flat Earth in March, the sun rises in New York before rising in eastern Brazil. In real life, it's the opposite.</small>
          </figcaption>
        </figure>
      <p>
        Indeed, on a flat Earth illuminated by a "flashlight," time zones and the illuminated circle don't match.
         <br/>The reason is simple: the beam gives round lighting, and time zones, on a flat Earth, are triangles.
      </p>

      <h3>The Moon</h3>
      <p>On a flat Earth, we shouldn't see the same image
       of the Moon depending on where we observe it (since "Flat Earthers" theorize it at 5000 km 
       altitude — and the flat Earth is 40,000 km from one end to the other), whereas
        on the SpaceView simulator (and in real life) we always see the same face and
       phase of the Moon, regardless of where we position ourselves (since for "Sphericalists," the Moon is almost 400,000 km away).
       <br/>On a spherical Earth, we also see an additional effect: the Moon is indeed the same, but we see it "turn" (until it's "upside down")<br/>
       </p>
       <div 
        className="info-content-margins grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 md:grid-cols-4 gap-4"
        style={{ marginTop : 0 }}>
          <figure className="m-0">
            <img
              src="/img/capture/spaceview-application-moon-paris.jpg"
              alt="Moon simulation viewed from Paris"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              The Moon viewed from Paris on a spherical Earth
            </figcaption>
          </figure>
          <figure className="m-0">
            <img
              src="/img/capture/spaceview-application-moon-cotonou.jpg"
              alt="Moon simulation viewed from Cotonou"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              View from Cotonou (6400 km south of Paris) at the same time
            </figcaption>
          </figure>
          <figure className="m-0">
            <img
              src="/img/capture/spaceview-application-moon-somalia.jpg"
              alt="Moon simulation viewed from Somalia"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              View from Somalia (6000 km east of Cotonou) at the same time
            </figcaption>
          </figure>
          <figure className="m-0">
            <img
              src="/img/capture/spaceview-application-moon-madagascar.jpg"
              alt="Moon simulation viewed from Madagascar"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              View from Madagascar (3000 km south of Somalia) at the same time
              
            </figcaption>
          </figure>
        </div>
        <p>On the flat Earth simulator, the Moon is seen from a different angle if we observe it from a different place.</p>
        <div 
          className="info-content-margins grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 md:grid-cols-4 gap-4"
          style={{ marginTop : 0 }}>
          <style>{`
            .crop570x597 {
              width: 100%;
              height: auto;
              aspect-ratio: 570 / 597;
              object-fit: cover;
              display: block;
            }
            @media (max-width: 620px) {
              .crop570x597 {
                width: 100%;
                height: auto;
                aspect-ratio: 570 / 597;
                object-fit: cover;
              }
            }
          `}</style>
          <figure className="m-0">
            <img
              src="/img/flatearth/fe-moon-paris.png"
              alt="Moon simulation viewed from Paris on a flat earth"
              className="crop570x597 w-auto h-auto rounded-md border border-black/10 shadow-sm"

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              The Moon viewed from Paris on a flat Earth
            </figcaption>
          </figure>
          <figure className="m-0">
            <img
              src="/img/flatearth/fe-moon-dakar.png"
              alt="Moon simulation viewed from Dakar on a flat earth"
              className="crop570x597 w-auto h-auto rounded-md border border-black/10 shadow-sm"

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Flat Earth simulation from Dakar (4000 km south of Paris) at the same time
            </figcaption>
          </figure>
          <figure className="m-0">
            <img
              src="/img/flatearth/fe-moon-mexico.png"
              alt="Moon simulation viewed from Mexico on a flat earth"
              className="crop570x597 w-auto h-auto rounded-md border border-black/10 shadow-sm"

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Flat Earth simulation from Mexico (10000 km west of Paris) at the same time
            </figcaption>
          </figure>
          <figure className="m-0">
            <img
              src="/img/flatearth/fe-moon-rio.png"
              alt="Moon simulation viewed from Rio de Janeiro on a flat earth"
              className="crop570x597 w-auto h-auto rounded-md border border-black/10 shadow-sm"

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Flat Earth simulation from Rio de Janeiro (8800 km west of Paris) at the same time
              
            </figcaption>
          </figure>
        </div>
       
      <h3>The Stars</h3>
      <p>With a flat Earth model, it's very difficult to explain the existence of two celestial poles
      (around which the stars rotate) and the fact that the skies of the northern and southern hemispheres are different.
      Yet observers in Australia see stars invisible from Europe!
      <br />Moreover, when we make a time-lapse of stars on a flat Earth, we should see them rotate around the "north" regardless of where we observe them, whereas on a spherical Earth, we see stars rotate clockwise at the south pole, and counterclockwise at the north pole.<br/>
      In these videos made on SpaceView, we can also see that when we're on the equator and look north, they rotate in the opposite direction from when we look south.</p>
      <div className="info-content-margins" style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <figure style={{ margin: 0, flex: '1 1 320px', maxWidth: '40%' }} className="fe-star-video">
          <video
            autoPlay
            muted
            loop
            preload="metadata"
            playsInline
            className="w-auto max-w-full h-auto rounded-md border border-black/10 shadow-sm"
          >
            <source src="/img/flatearth/fe-stars-1.webm" type="video/webm" />
            Your browser doesn't support WebM video playback.
          </video>
          <figcaption className="text-sm text-gray-500 mt-1">
            Star timelapse viewed from Santiago de Surco in Peru, looking south.
          </figcaption>
        </figure>
        <figure style={{ margin: 0, flex: '1 1 320px', maxWidth: '40%' }} className="fe-star-video">
          <video
            autoPlay
            muted
            loop
            preload="metadata"
            playsInline
            className="w-auto max-w-full h-auto rounded-md border border-black/10 shadow-sm"
          >
            <source src="/img/flatearth/fe-stars-2.webm" type="video/webm" />
            Your browser doesn't support WebM video playback.
          </video>
          <figcaption className="text-sm text-gray-500 mt-1">
            Star timelapse viewed from Santiago de Surco in Peru, looking north.
          </figcaption>
        </figure>
      </div>
    
      <h3>Solar Eclipses</h3>
      <p>During solar eclipses, the Moon passes between us and the sun. 
      So the Moon must necessarily be closer to us than the sun is. 
      This is possible in the flat Earth simulator above, but it's complicated to find how to place the Moon and sun to get eclipses as we observe them from different places. 
      <br/>If we try with the next eclipse (which will be visible on August 12, 2026 between Europe and North Africa): 
      The following captures (made with SpaceView) predict how the eclipse will be at exactly 8:32 PM (Paris time), from different places:
      <br/>
      </p>
      <div 
        className="info-content-margins grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 md:grid-cols-4 gap-4"
        style={{ marginTop : 0 }}>
          <figure className="m-0">
            <img
              src="/img/capture/spaceview-eclipse-2026-oslo.jpg"
              alt="Oslo, Norway, August 12, 2026 at 8:32 PM (SpaceView simulation)"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Oslo, Norway, August 12, 2026 at 8:32 PM (SpaceView simulation)
            </figcaption>
          </figure>
          <figure className="m-0">
            <img
              src="/img/capture/spaceview-eclipse-2026-london.jpg"
              alt="London, UK, August 12, 2026 at 7:32 PM (local time) (SpaceView simulation)"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              London, UK, August 12, 2026 at 7:32 PM (local time) (SpaceView simulation)
            </figcaption>
          </figure>
          <figure className="m-0">
            <img
              src="/img/capture/spaceview-eclipse-2026-berlin.jpg"
              alt="Berlin, Germany, August 12, 2026 at 8:32 PM (SpaceView simulation)"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Berlin, Germany, August 12, 2026 at 8:32 PM (SpaceView simulation)
            </figcaption>
          </figure>
          <figure className="m-0">
            <img
              src="/img/capture/spaceview-eclipse-2026-paris.jpg"
              alt="Paris, France, August 12, 2026 at 8:32 PM (SpaceView simulation)"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Paris, France, August 12, 2026 at 8:32 PM (SpaceView simulation)
              
            </figcaption>
          </figure>
        </div>
      <div 
        className="info-content-margins grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 md:grid-cols-4 gap-4"
        style={{ marginTop : 0 }}>
          <figure className="m-0">
            <img
              src="/img/capture/spaceview-eclipse-2026-madrid.jpg"
              alt="Madrid, Spain, August 12, 2026 at 8:32 PM (SpaceView simulation)"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Madrid, Spain, August 12, 2026 at 8:32 PM (SpaceView simulation)
            </figcaption>
          </figure>
          <figure className="m-0">
            <img
              src="/img/capture/spaceview-eclipse-2026-Rabat.jpg"
              alt="Rabat, Morocco, August 12, 2026 at 7:32 PM (local time) (SpaceView simulation)"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Rabat, Morocco, August 12, 2026 at 7:32 PM (local time) (SpaceView simulation)
            </figcaption>
          </figure>
          <figure className="m-0">
            <img
              src="/img/capture/spaceview-eclipse-2026-alger.jpg"
              alt="Algiers, Algeria, August 12, 2026 at 7:32 PM (local time) (SpaceView simulation)"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Algiers, Algeria, August 12, 2026 at 7:32 PM (local time) (SpaceView simulation)
            </figcaption>
          </figure>
          <figure className="m-0">
            <img
              src="/img/capture/spaceview-eclipse-2026-dakar.jpg"
              alt="Dakar, Senegal, August 12, 2026 at 6:32 PM (local time) (SpaceView simulation)"
              className="w-auto max-w-auto h-auto rounded-md border border-black/10 shadow-sm"  

            />
            <figcaption className="text-sm text-gray-500 mt-1">
              Dakar, Senegal, August 12, 2026 at 6:32 PM (local time) (SpaceView simulation)
              
            </figcaption>
          </figure>
        </div>
      <p>
        These 8 images are simulated (and can be verified on location) <strong>exactly</strong> at the same moment. So call your friends during the eclipse and &nbsp;
      <a
        href="/?tl=2i2o.t5cuxn&lp=5xc&l=3117735&t=tjo65c&F=0&p=0&d=nikon-p1000&z=p1000-2000eq&b=94p3&pl=a&sr=0.0167&pc=3117735.2988507.2643743.2507480.2538475.2950159.2253354.3143244"
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        Compare with the SpaceView simulation (spherical Earth)
      </a>
      <br/>So far no one has found a flat earth configuration that can explain all these images simultaneously.
      </p>
      <h3>Lunar Eclipses</h3>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', margin: '16px 0', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 360px', minWidth: '280px' }}>
          <p style={{ marginRight: 0 }}>
          During lunar eclipses, the Moon passes "behind Earth" and crosses our planet's shadow. 
          At the beginning and end of the eclipse, we can see the rounded shape of our planet (the edge of the shadow).
          This is one of the oldest proofs of Earth's roundness (Aristotle had already noticed it in 350 BC).
          On a flat Earth, we can't explain why Earth's shadow is always round during a lunar eclipse.
          <br/>Moreover, during a lunar eclipse, the Moon turns red (due to light scattering in Earth's atmosphere). 
          On a flat Earth, we can't explain why the Moon turns red during a lunar eclipse.
          </p>
        </div>
        <figure style={{ marginLeft: '0', marginRight: '5rem', flex: '0 0 320px', maxWidth: '420px' }}>
          <img
            src="/img/examples/export-red-moon.jpg"
            alt="Red moon phase of a lunar eclipse"
            loading="lazy"
            style={{ width: '100%', height: 'auto', borderRadius: '8px', border: '1px solid #333' }}
          />
          <figcaption style={{ fontSize: '0.9em', color: '#aaa', marginTop: '6px' }}>
            <small>Red moon phase of a lunar eclipse.</small>
          </figcaption>
        </figure>
      </div>
      <div className="info-content-margins" style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <figure style={{ margin: 0, flex: '1 1 320px', maxWidth: '40%' }} className="fe-star-video">
          <video
            autoPlay
            muted
            loop
            preload="metadata"
            playsInline
            className="w-auto max-w-full h-auto rounded-md border border-black/10 shadow-sm"
          >
            <source src="/img/capture/video-moon-eclipse-australia.webm" type="video/webm" />
            Your browser doesn't support WebM video playback.
          </video>
          <figcaption className="text-sm text-gray-500 mt-1">
            Beginning of lunar eclipse viewed from Australia. We see Earth's shadow advancing (real duration 38 minutes)
          </figcaption>
        </figure>
        <figure style={{ margin: 0, flex: '1 1 320px', maxWidth: '40%' }} className="fe-star-video">
          <video
            autoPlay
            muted
            loop
            preload="metadata"
            playsInline
            className="w-auto max-w-full h-auto rounded-md border border-black/10 shadow-sm"
          >
            <source src="/img/capture/video-moon-eclipse-japan.webm" type="video/webm" />
            Your browser doesn't support WebM video playback.
          </video>
          <figcaption className="text-sm text-gray-500 mt-1">
            Same lunar eclipse viewed from Japan.
          </figcaption>
        </figure>
      </div>
      <p>
      
      <br/>So far, no one has found a flat Earth configuration that can explain both the shadow that appears on the Moon in 30 to 40 minutes, and the fact that we don't see it oriented the same way in the southern hemisphere and northern hemisphere.  &nbsp;
      <a
        href='/?tl=3wn4.t2884e&lp=5xc&g=rhby8kxye&tz=Australia%2FDarwin&t=t287xz&F=1&p=0&d=custom&k=1&f=1fy&b=9hcf&pl=a&sr=2.0167'
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        See the spherical earth simulation
      </a>
      </p>

      <p>
        <a
          href="#flat-earth-simulator"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition"
          style={{color:'white'}}
        >
          Try anyway with the flat earth simulator
        </a>
      </p>

      <h2>What If It Were Spherical?</h2>
    
      <p>Science isn't about blindly believing what you're told. It's about observing, testing, verifying. This application gives you the tools. It's your turn to play! Compare what you see in the application with the real sky. Ask yourself questions. Look for explanations.</p>
      
      <p>And remember: if the Earth were really flat, it would require a conspiracy involving millions of people (scientists, pilots, sailors, engineers...) from all countries, for centuries, without any of them selling out to become rich and famous.</p>
      
      <p>Or maybe... the Earth is just round, and everything becomes simple! 🌍</p>
      
      <p><em>"The good thing about science is that it's true whether or not you believe in it."</em> - Neil deGrasse Tyson</p>
    </article>
  );
}