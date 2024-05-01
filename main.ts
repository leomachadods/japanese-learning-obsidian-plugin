import { CachedMetadata, Plugin, TFile, getAllTags } from "obsidian";

export default class JapaneseLearningPlugin extends Plugin {

	private tagName = "JPStudy";
	private japaneseCharactersRegex = /[\u3000-\u303F]|[\u3040-\u309F]|[\u30A0-\u30FF]|[\uFF00-\uFFEF]|[\u4E00-\u9FAF]|[\u2605-\u2606]|[\u2190-\u2195]|\u203B/g

	counts: { [key: string]: number } = {
		vocabulary: 0,
		idioms: 0,
		materials: 0
	}


	sectionMap: { [key: string]: string } = {
		'Vocabulary': 'vocabulary',
		'Idioms': 'idioms',
		'Materials': 'materials'
	};


	async onload() {

		let markdownFiles = this.app.vault.getMarkdownFiles();

		let filesWithTag = await this.getFilesWithSpecificTag(markdownFiles, this.tagName);

		for (let file of filesWithTag) {
			let content = await this.app.vault.read(file);
			let sections = content.split('---');

			sections.forEach(section => {
				let lines = section.split('\n');
				let currentSection: string | null = null;
			
				lines.forEach(line => {
					if(line.startsWith('# ')) {
						let sectionName = line.slice(2).trim();
						currentSection = this.sectionMap[sectionName];
					} else {
						this.updateObjectCountsValues(line, currentSection);
					}
				});
			});
			
		}

		console.log(`Os valores são: \nVocabulário: ${this.counts["vocabulary"]}\nExpressões: ${this.counts["idioms"]}\nMateriais: ${this.counts["materials"]}`)
	}


	private async getFilesWithSpecificTag(files: TFile[], tag: string): Promise<TFile[]> {
		let filesWithTag: TFile[] = [];
	
		for (let file of files) {
			if(file.basename == "Japanese study template") 
				continue;
			
			let cache = this.app.metadataCache.getFileCache(file);
			if (cache && cache.frontmatter) {
				let tags: string[] = cache.frontmatter.tags;
				if (tags.includes(tag)) {
					filesWithTag.push(file);
				}
			}
		}
	
		return filesWithTag;
	}
	

	private updateObjectCountsValues(line: string, currentSection: string | null) {
		if (line.startsWith('# ')) {
			let sectionName = line.slice(2).trim();
			currentSection = this.sectionMap[sectionName];
		}

		else if (line.startsWith('---')) {
			currentSection = null;
		}

		else if (currentSection) {
			if (line.trim() !== '' && !line.startsWith('---')) {
				if (currentSection == "materials" || this.japaneseCharactersRegex.test(line)) {
					this.counts[currentSection]++;
				}
			}
		}
	}
}
