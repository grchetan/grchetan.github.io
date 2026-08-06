import { createFileRoute } from "@tanstack/react-router";
import { NotFoundScape } from "../components/site/error-pages";

export const Route = createFileRoute("/$")({
  component: () => <NotFoundScape />,
});
