import { randomInt } from 'node:crypto'

/** Short, easy-to-type words for pairing codes: 240 × 240 × 90 is about 5 million codes, each valid for 15 minutes. */
const WORDS = (
	'acorn amber anchor apple arrow aspen autumn badger bamboo banjo barley basil beacon berry birch ' +
	'biscuit blossom bramble breeze brook bubble button cactus candle canoe canyon carrot cedar cello ' +
	'cherry chestnut cider cinder clover cobalt comet copper coral cotton cougar cove crane cricket ' +
	'crystal cocoa daisy dawn delta denim dingo dolphin dove dragon drift dune eagle echo elder ember ' +
	'falcon fern fiddle fig finch flint forest fossil fox frost galaxy garnet gecko ginger glacier ' +
	'globe goose granite grape gravel grove gull harbor hazel heather heron hickory honey hopper ' +
	'iris island ivory ivy jade jasmine jelly jungle juniper kayak kelp kettle kiwi koala lagoon ' +
	'lantern larch lark lava lemon lilac lily lime linen lotus lunar lynx maple marble marsh meadow ' +
	'melon meteor mint mist moose moss moth mulberry nectar nest nickel nimbus nutmeg oak oasis ocean ' +
	'olive onyx opal orbit orchid otter owl paddle panda pebble pepper petal pine planet plum pond ' +
	'poppy prairie puffin quartz quill rabbit radish rain raven reef ripple river robin rocket rose ' +
	'ruby saffron sage salmon sand sapphire satin season sequoia shell sierra silver sky slate sparrow ' +
	'spruce squash star stone storm sugar summit sunset swan tango teal thistle thunder tiger timber ' +
	'toffee topaz tulip tundra turtle twig valley velvet violet volcano walnut walrus wave willow ' +
	'winter wren yarrow zebra zephyr zinc badge cliff pansy cabin chalk fable gale hollow ink jasper ' +
	'kernel lichen mango nova oyster pixel quail rowan sorrel thyme umber vine wicker yeti'
).split(' ')

export function makePairCode(): string {
	const word = () => WORDS[randomInt(WORDS.length)]
	return `${word()}-${word()}-${randomInt(10, 100)}`
}

export function normalisePairCode(input: string): string {
	return input.trim().toLowerCase().replace(/\s+/g, '-')
}
