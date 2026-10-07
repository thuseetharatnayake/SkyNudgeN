import { RoutePlaceholder } from './RoutePlaceholder';

export const LoginPage = (): JSX.Element => <RoutePlaceholder eyebrow="SkyNudge" title="Look up before it is gone." description="Log in to see what is happening in the sky around you." />;
export const CreateAccountPage = (): JSX.Element => <RoutePlaceholder eyebrow="Create account" title="A name just for the sky." description="Your SkyNudge username is anonymous and auto-generated." />;
export const VerificationIntroPage = (): JSX.Element => <RoutePlaceholder eyebrow="Identity" title="A quieter way to know who is nearby." description="Learn how a private identity check works." />;
export const VerificationFormPage = (): JSX.Element => <RoutePlaceholder eyebrow="Identity" title="Verify your account." description="Submit your legal name and phone number privately." />;
export const WelcomePage = (): JSX.Element => <RoutePlaceholder eyebrow="Welcome" title="The sky is waiting." description="Your anonymous account is ready." />;
export const HomePage = (): JSX.Element => <RoutePlaceholder eyebrow="Right now in Melbourne" title="Something beautiful is happening." description="Tap a glow. Then put your phone down and look up." />;
export const ActiveMomentPage = (): JSX.Element => <RoutePlaceholder eyebrow="Active moment" title="A sky moment near you." description="See the direction, time left, and people watching." />;
export const NudgeStepOnePage = (): JSX.Element => <RoutePlaceholder eyebrow="New SkyNudge · 1 of 2" title="What are you seeing?" description="Choose the sky moment and how urgent it feels." />;
export const NudgeStepTwoPage = (): JSX.Element => <RoutePlaceholder eyebrow="New SkyNudge · 2 of 2" title="Help people find it." description="Share an approximate direction and location." />;
export const NudgeSuccessPage = (): JSX.Element => <RoutePlaceholder eyebrow="Sent" title="Your SkyNudge is live." description="Now put your phone down and look up." />;
export const MomentsFeedPage = (): JSX.Element => <RoutePlaceholder eyebrow="Private archive" title="My Sky Moments" description="Private. Only you can see these." />;
export const MomentsCalendarPage = (): JSX.Element => <RoutePlaceholder eyebrow="Private archive" title="My Sky Moments" description="Browse your private moments by day." />;
export const SelectedDayPage = (): JSX.Element => <RoutePlaceholder eyebrow="Private archive" title="A day in the sky." description="Your saved moments from this selected day." />;
export const AccountPage = (): JSX.Element => <RoutePlaceholder eyebrow="Account" title="Your sky identity." description="Your anonymous username and verification status." />;
export const SettingsPage = (): JSX.Element => <RoutePlaceholder eyebrow="Settings" title="Your preferences." description="Control location sharing, alerts, and your default radius." />;