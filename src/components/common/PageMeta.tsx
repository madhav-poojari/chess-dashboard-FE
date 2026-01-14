import { HelmetProvider, Helmet } from "react-helmet-async";

const PageMeta = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  const finalTitle = title.includes("BRS Academy") ? title : `${title} | BRS Academy`;
  
  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="description" content={description} />
      <link rel="icon" type="image/png" href="/images/brs-logo/brs-flat.png" />
      <link rel="apple-touch-icon" href="/images/brs-logo/brs-flat.png" />
    </Helmet>
  );
};

export const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <HelmetProvider>{children}</HelmetProvider>
);

export default PageMeta;
