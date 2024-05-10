import { CachedMetadata, Plugin, TFile, getAllTags } from "obsidian";
import AnkiBridge from "anki";
import axios from 'axios';
import Word from "word";

export default class JapaneseLearningPlugin extends Plugin {

	private japaneseStudyFileTag = "JPStudy";
	private japaneseCharactersRegex = /[\u3000-\u303F]|[\u3040-\u309F]|[\u30A0-\u30FF]|[\uFF00-\uFFEF]|[\u4E00-\u9FAF]|[\u2605-\u2606]|[\u2190-\u2195]|\u203B/g

	private sectionMap: { [key: string]: (line: string) => boolean } = {
		'vocabulary': this.countJapaneseWords,
		'idioms': this.countJapaneseWords,
		'materials': this.countAllLines,
		'grammar points': this.countJapaneseWords
	};

	private counts: { [key: string]: number } = {
		'vocabulary': 0,
		'idioms': 0,
		'materials': 0,
		'grammar points': 0
	};
	

	async onload() {

		let markdownFiles = this.app.vault.getMarkdownFiles();
		let filesWithTag = await this.getFilesWithSpecificTag(markdownFiles, this.japaneseStudyFileTag);
		
		for (let file of filesWithTag) {
			await this.processFileToIncreaseCounters(file);
		}
		
		this.addCommand({
			id: 'create-anki-decks',
			name: 'Create Anki Flashcards',
			callback: this.createAnkiCards.bind(this)
		})

		console.log(`Vocabulário: ${this.counts['vocabulary']}\nExpressões: ${this.counts['idioms']}\nMateriais: ${this.counts['materials']}\nGrammar Points: ${this.counts['grammar points']}`);
	}

	private async readWordsAtMemory() {
		const words: Word[] = [];
		const fileDates: string[] = []
	 	let markdownFiles = this.app.vault.getMarkdownFiles();
		let filesWithTag = await this.getFilesWithSpecificTag(markdownFiles, this.japaneseStudyFileTag)

		for(let file of filesWithTag) {
			let content = await this.app.vault.read(file);
			let sections = content.split('---').filter(content => content !== "")
			
			sections.forEach(section => {
				let lines = section.split('\n')
				let currentSection: string | null = null;
				
				lines.forEach(async line => {
					if(line.startsWith("# ")) {
						let sectionName = line.slice(2).trim().toLowerCase()
						currentSection = sectionName;
					} else if(currentSection == "vocabulary" && line.trim() !== '' && line.trim() !== '-' && line.trim() !== '---') {
						let { term, reading, definition } = this.extractTermReadingDefinition(line)
						words.push(new Word(term, reading, definition))
					}
				})
			})
		}
		return words
	}

	private async createAnkiCards() {
		const words = await this.readWordsAtMemory();
		const Anki = new AnkiBridge();

		await Anki.createAnkiDeck();
		words.forEach(word => {
			Anki.createAnkiCard(word)
		})
	}

	private extractTermReadingDefinition(line: string) {
		let [termAndReadingUnformatted, definition] = line.split('ー').map(s => s.trim());
		let termAndReading = termAndReadingUnformatted.split("「").filter(item => item !== "");
		let [term, reading] = termAndReading
		
		if(term.startsWith("- ")) {
			term = term.slice(2)
		}

		term = term.trim()

		if(term.startsWith("[[")) {
			term = term.replace(/\[\[|\]\]/g, "");
		}

		return {term, reading, definition}
	}

	private async processFileToIncreaseCounters(file: TFile) {
		let content = await this.app.vault.read(file);
		let sections = content.split('---');

		sections.forEach(section => {
			let lines = section.split('\n');
			let currentSection: string | null = null;

			lines.forEach(line => {
				if (line.startsWith('# ')) {
					let sectionName = line.slice(2).trim().toLowerCase();
					currentSection = sectionName;
				} else if (currentSection && this.sectionMap[currentSection]) {
					if (line.trim() !== '' && line.trim() !== '-' && line.trim() !== '---') {
						this.counts[currentSection]++;
					}
				}
			});
		});
	}


	private async getFilesWithSpecificTag(files: TFile[], tag: string): Promise<TFile[]> {
		let filesWithTag: TFile[] = [];

		for (let file of files) {
			if (file.basename == "Japanese study template")
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

	private countJapaneseWords(line: string): boolean {
		return this.japaneseCharactersRegex.test(line);
	}
	
	private countAllLines(line: string): boolean {
		return line.trim() !== '' && !line.startsWith('---');
	}

}