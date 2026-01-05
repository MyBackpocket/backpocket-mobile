import { type Href, Link } from "expo-router";
import type { ComponentProps } from "react";
import { useOpenUrl } from "@/lib/utils";

type Props = Omit<ComponentProps<typeof Link>, "href"> & {
	href: Href & string;
};

export function ExternalLink({ href, ...rest }: Props) {
	const { openUrl } = useOpenUrl();

	return (
		<Link
			target="_blank"
			{...rest}
			href={href}
			onPress={async (event) => {
				if (process.env.EXPO_OS !== "web") {
					// Prevent the default behavior of linking to the default browser on native.
					event.preventDefault();
					// Open the link using the user's preferred method.
					await openUrl(href);
				}
			}}
		/>
	);
}
