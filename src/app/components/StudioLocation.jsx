import { SITE_NAME } from "../lib/site";
import { getSiteSettings } from "../lib/content";
import { Eyebrow } from "./SectionHead";
import MapEmbed from "./MapEmbed";

export default async function StudioLocation() {
    const { business } = await getSiteSettings();
    const { address } = business;
    return (
        <section className="studio-location" data-tone="plain">

            <div className="location-header">
                <Eyebrow center>Visit Our Studio</Eyebrow>

                <h2>
                    Experience Design <br />
                    In Person
                </h2>

                <p>
                    Meet our designers, explore materials, and discuss your
                    dream space at our studio.
                </p>
            </div>

            <div className="location-wrapper">

                <div className="location-card">

                    <h3>{SITE_NAME}</h3>

                    <p>
                        {address.streetAddress} <br />
                        {address.addressLocality}, {address.addressRegion} {address.postalCode}
                    </p>

                    <a
                        href={business.mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="location-btn"
                    >
                        Open In Google Maps
                    </a>

                </div>

                <div className="location-map">

                    <MapEmbed
                        title="Arch Creative Interiors studio location map"
                        embedUrl={business.mapsEmbedUrl}
                        mapsUrl={business.mapsUrl}
                    />
                </div>

            </div>

        </section>
    );
}