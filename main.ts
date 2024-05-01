import { CachedMetadata, Plugin, getAllTags } from "obsidian";

export default class JapaneseLearningPlugin extends Plugin {

	private tagName = "JPStudy";
	private japaneseCharactersRegex = /[\u3000-\u303F]|[\u3040-\u309F]|[\u30A0-\u30FF]|[\uFF00-\uFFEF]|[\u4E00-\u9FAF]|[\u2605-\u2606]|[\u2190-\u2195]|\u203B/g

	private vocabularyCount = 0;
	private idiomsCount = 0;
	private materialsCount = 0;

	async onload() {

		let markdownFiles = this.app.vault.getMarkdownFiles();

		let filesWithTag = markdownFiles.filter(file => {
			let cache = this.app.metadataCache.getFileCache(file);
			if (cache && cache.frontmatter) {
				let tags : string[] = cache.frontmatter.tags;
				return tags.includes(this.tagName)
			}
		})

		for (let file of filesWithTag) {
			let content = await this.app.vault.read(file);
			let sections = content.split('---');
	
			sections.forEach(section => {
				let lines = section.split('\n')
				let isCounting = false;
				let count = 0;
	
				lines.forEach(line => {
					if(line.startsWith('# ')) {
						isCounting = true;
					}
	
					else if(line.startsWith('---')){
						isCounting = false;
					}
	
					else if(isCounting && this.japaneseCharactersRegex.test(line)){
						console.log("deschug")
						count++
					}
				})
				this.vocabularyCount += count;
			})
		}

		console.log("Vocabulário: " + this.vocabularyCount)
	}

}
