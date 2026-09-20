import { HeartHandshake, Leaf, ShieldCheck, Wallet } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import SectionHeading from '../components/SectionHeading';
import CtaBanner from '../components/CtaBanner';
import Img from '../components/Img';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import '../styles/About.css';

const VALUES = [
  { icon: ShieldCheck, title: 'Safety first', text: 'Trained captains, vetted vehicles and stays, and a first-aid and oxygen kit on every mountain departure.' },
  { icon: Wallet, title: 'Honest pricing', text: 'You see the inclusions, exclusions and a full price breakdown before you book. No surprise add-ons.' },
  { icon: Leaf, title: 'Travel lightly', text: 'We work with local homestays and guides, keep groups small and ask everyone to leave places as they found them.' },
  { icon: HeartHandshake, title: 'People over itineraries', text: 'Good trips are about who you travel with. We build in time to slow down, talk and stay curious.' },
];

const STEPS = [
  { title: 'Pick a trip', text: 'Browse itineraries, compare inclusions and choose a departure date that suits you.' },
  { title: 'Send a booking request', text: 'Share your details and our team confirms availability with you personally.' },
  { title: 'Travel with a captain', text: 'Meet your group, hand over the logistics and enjoy the journey.' },
];

export default function About() {
  useDocumentTitle('About us');

  return (
    <>
      <PageHeader eyebrow="About us" title="We help people travel further, together" description="Travel With Dreams runs small-group trips across India and abroad, built around good company, honest pricing and local experiences." />

      <section className="section">
        <div className="container about-story">
          <div className="about-story__media">
            <Img src="https://images.unsplash.com/photo-1503220317375-aaad61436b1b" alt="A traveller in a red backpack looking out over a mountain lake" width={1000} sizes="(min-width: 900px) 45vw, 100vw" />
          </div>
          <div className="about-story__text">
            <p className="eyebrow">Our story</p>
            <h2>Started by travellers who wanted better group trips</h2>
            <p>
              Too many group tours feel like a race between photo stops. We wanted trips with room to breathe: stays we would choose ourselves, a captain who
              knows the road and a group small enough to become friends.
            </p>
            <p>
              Today we run journeys from the high passes of Ladakh to the backwaters of Kerala and the beaches of Bali. Every itinerary is designed in-house,
              tested by our own team and refined with feedback from the people who travel with us.
            </p>
          </div>
        </div>
      </section>

      <section className="section section--soft">
        <div className="container">
          <SectionHeading center eyebrow="What we stand for" title="The principles behind every trip" />
          <ul className="values">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="why-card">
                <span className="why-card__icon">
                  <Icon aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading center eyebrow="How it works" title="From idea to boarding pass in three steps" />
          <ol className="steps">
            {STEPS.map(({ title, text }, index) => (
              <li key={title}>
                <span className="steps__number" aria-hidden="true">
                  {index + 1}
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
