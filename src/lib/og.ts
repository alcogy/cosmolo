import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';
import { siteConfig } from './config';

// Font data is read once and cached
let fontRegular: Buffer | null = null;
let fontBold: Buffer | null = null;

function getFontData(): [Buffer, Buffer] {
	if (!fontRegular || !fontBold) {
		fontRegular = readFileSync(
			'node_modules/@fontsource/inter/files/inter-latin-400-normal.woff'
		);
		fontBold = readFileSync(
			'node_modules/@fontsource/inter/files/inter-latin-700-normal.woff'
		);
	}
	return [fontRegular, fontBold];
}

/**
 * Generates a 1200×630 OGP PNG for an article.
 * @param title  Article title shown large in the center.
 * @param category  Category label shown above the title.
 */
export async function renderOgImage(title: string, category?: string): Promise<Buffer> {
	const [regular, bold] = getFontData();

	const svg = await satori(
		{
			type: 'div',
			props: {
				style: {
					height: '100%',
					width: '100%',
					display: 'flex',
					flexDirection: 'column',
					backgroundColor: '#ffffff',
					fontFamily: 'Inter'
				},
				children: [
					// Accent bar
					{
						type: 'div',
						props: {
							style: { width: '100%', height: '12px', backgroundColor: '#4a90d9' }
						}
					},
					// Body
					{
						type: 'div',
						props: {
							style: {
								flex: 1,
								display: 'flex',
								flexDirection: 'column',
								justifyContent: 'center',
								padding: '0 80px',
								gap: '20px'
							},
							children: [
								// Category label
								...(category
									? [
											{
												type: 'div',
												props: {
													style: {
														fontSize: 24,
														fontWeight: 400,
														color: '#4a90d9',
														textTransform: 'uppercase' as const,
														letterSpacing: '0.08em'
													},
													children: category
												}
											}
										]
									: []),
								// Title
								{
									type: 'div',
									props: {
										style: {
											fontSize: 58,
											fontWeight: 700,
											color: '#1a1a2e',
											lineHeight: 1.25
										},
										children: title
									}
								}
							]
						}
					},
					// Footer
					{
						type: 'div',
						props: {
							style: {
								padding: '0 80px 52px',
								display: 'flex',
								alignItems: 'center'
							},
							children: [
								{
									type: 'div',
									props: {
										style: { fontSize: 28, fontWeight: 400, color: '#6b7280' },
										children: siteConfig.name
									}
								}
							]
						}
					}
				]
			}
		},
		{
			width: 1200,
			height: 630,
			fonts: [
				{ name: 'Inter', data: regular, weight: 400, style: 'normal' },
				{ name: 'Inter', data: bold, weight: 700, style: 'normal' }
			]
		}
	);

	const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
	return Buffer.from(resvg.render().asPng());
}
