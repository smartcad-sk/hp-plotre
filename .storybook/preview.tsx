import type { Preview } from "@storybook/nextjs-vite";
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    layout: "padded",
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    a11y: { test: "error" },
    viewport: {
      options: {
        xs: { name: "XS 320", styles: { width: "320px", height: "640px" } },
        phone: { name: "Phone 375", styles: { width: "375px", height: "812px" } },
        tablet: { name: "Tablet 768", styles: { width: "768px", height: "1024px" } },
        laptop: { name: "Laptop 1280", styles: { width: "1280px", height: "800px" } },
      },
    },
    nextjs: { appDirectory: true },
  },
  decorators: [
    (Story) => (
      <div lang="sk" className="font-sans text-ink">
        <Story />
      </div>
    ),
  ],
};

export default preview;
