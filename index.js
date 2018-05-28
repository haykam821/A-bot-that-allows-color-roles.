const config = require("./config.json");

const djs = require("discord.js");
const client = new djs.Client();
client.login(config.token);

const forEach = require("await-each");

client.on("ready", async () => {
	const channel = client.channels.get(config.channel);
	const guild = channel.guild;
	const allRoles = guild.roles;

	const cRoles = cleanRoles(config.roles, allRoles).filter(cRole => cRole);

	if (config.tutorial) {
		await channel.send([
			"Click a reaction below each color role to get it.",
			"If you want to remove your color role, click the reaction below the color you already have.",
		].join("\n"));
	}

	forEach(cRoles, async role => {
		if (!role) return;

		const msg = await channel.send("", {
			embed: {
				title: role.name,
				color: role.color,
			},
		});
		await msg.react(config.reaction);

		const collector = msg.createReactionCollector((reaction, user) => {
			return reaction.emoji.name === config.reaction && user.id !== client.user.id;
		});
		collector.on("collect", async reaction => {
			reaction.message.clearReactions();

			const reactors = reaction.users.array().filter(reactor => reactor.id !== client.user.id);
			updateMemberRoles(reactors, guild, reaction.message, cRoles);

			reaction.message.react(config.reaction);
		});
	});
});

function updateMemberRoles(reactors, guild, msg, cRoles) {
	forEach(reactors, async reactor => {
		const member = guild.members.get(reactor.id);
		const roles = member.roles.filter(role => {
			return cRoles.filter(cRole => cRole.id === role.id).length > 0;
		});
		member.addRole(FbNoID(guild.roles, msg.embeds[0].title), "Gave member new color role by their request.");
		roles.forEach(role => member.removeRole(role), "Cleaning up color roles for member.");
	});
}

function cleanRoles(roles, allRoles) {
	return roles.map(role => FbNoID(allRoles, role)).sort((a, b) => {
		return a.name.localeCompare(b.name);
	});
}

// short for "Find by Name or ID"
function FbNoID(collection, by) {
	const byID = collection.find("id", by);
	const byName = collection.find("name", by);

	return byID ? byID : byName ? byName : undefined;
}