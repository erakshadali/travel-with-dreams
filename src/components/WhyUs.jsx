import { BadgeIndianRupee, Compass, ShieldCheck, Users } from 'lucide-react';
import SectionHeading from './SectionHeading';

const REASONS = [
  {
    icon: Compass,
    title: 'Expert trip captains',
    text: 'A trained captain travels with every group and handles logistics, safety and the little things.',
  },
  {
    icon: Users,
    title: 'Small groups',
    text: 'Capped group sizes mean real experiences with locals, not crowds and long queues.',
  },
  {
    icon: BadgeIndianRupee,
    title: 'Transparent pricing',
    text: 'Every trip shows exactly where your money goes, with inclusions and exclusions spelled out.',
  },
  {
    icon: ShieldCheck,
    title: 'Vetted stays & partners',
    text: 'Hotels, camps and drivers are chosen for safety and comfort, not just for the lowest rate.',
  },
];

export default function WhyUs() {
  return (
    <section className="section section--soft">
      <div className="container">
        <SectionHeading
          center
          eyebrow="Why Travel With Dreams"
          title="Trips designed around you, not a checklist"
          description="We plan the details so you can focus on the mountain views, the food and the people you are travelling with."
        />
        <ul className="why-grid">
          {REASONS.map(({ icon: Icon, title, text }) => (
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
  );
}
