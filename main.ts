import { CachedMetadata, Plugin, TFile, getAllTags } from "obsidian";
import axios from 'axios';

export default class JapaneseLearningPlugin extends Plugin {

	private japaneseStudyFileTag = "JPStudy";
	private japaneseCharactersRegex = /[\u3000-\u303F]|[\u3040-\u309F]|[\u30A0-\u30FF]|[\uFF00-\uFFEF]|[\u4E00-\u9FAF]|[\u2605-\u2606]|[\u2190-\u2195]|\u203B/g
	private dateRegex = /date: (\d{4}-\d{2}-\d{2})/;

	private deckName = "Japanese";
	private modelName = 'Basic';
		// Substitua 'FrontField' e 'BackField' pelos nomes dos campos no seu modelo
	private frontField = 'Front';
	private backField = 'Back';

	sectionMap: { [key: string]: (line: string) => boolean } = {
		'vocabulary': this.countJapaneseWords,
		'idioms': this.countJapaneseWords,
		'materials': this.countAllLines,
		'grammar points': this.countJapaneseWords
	};

	counts: { [key: string]: number } = {
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

	async createAnkiCards() {
		let markdownFiles = this.app.vault.getMarkdownFiles();
		let filesWithTag = await this.getFilesWithSpecificTag(markdownFiles, this.japaneseStudyFileTag)

		for(let file of filesWithTag) {
			let content = await this.app.vault.read(file);
			let sections = content.split('---').filter(content => content !== "")
			await this.createDeckBasedOnFileDate(sections);
			
			sections.forEach(section => {
				let lines = section.split('\n')
				let currentSection: string | null = null;
				lines.forEach(async line => {
					if(line.startsWith("# ")) {
						let sectionName = line.slice(2).trim().toLowerCase()
						currentSection = sectionName;
					} else if(currentSection == "vocabulary" && line.trim() !== '' && line.trim() !== '-' && line.trim() !== '---') {
						let [completeTerm, definition] = line.split('ー').map(s => s.trim());
						let newArr = completeTerm.split("「").filter(item => item !== "");
						let [term, reading] = newArr
						
						await this.createAnkiCard(term.slice(2).trim(), reading, definition);
					}
				})
			})
		}
	}

	private async createDeckBasedOnFileDate(sections: string[]) {
		let firstSection = sections.first()?.trim();
		if (firstSection) {
			let match = firstSection.match(this.dateRegex);
			if (match) {
				await this.createAnkiDeck(match[1]);
				this.deckName = match[1];
			}
		}
	}

	async createAnkiCard(term: string, reading: string, definition: string) {

		let front = term;
		let back;

		if(!reading) {
			back = `${definition}`;
		} else {
			back = `${definition}<br><br>「${reading}`;
		}
		

		let note = {
			deckName: this.deckName,
			modelName: this.modelName,
			fields: {
				[this.frontField]: front,
				[this.backField]: back
			},
			options: {
				allowDuplicate: false
			},
			tags: []
		};

		let result = await axios.post('http://localhost:8765', {
			action: 'addNote',
			version: 6,
			params: {
				note: note
			}
		});

		if (result.data.error)
			console.log(`Erro ao criar cartão do Anki: ${result.data.error}`);
		
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

	async createAnkiDeck(deckName: string) {
		let result = await axios.post('http://localhost:8765', {
			action: 'createDeck',
			version: 6,
			params: {
				deck: deckName
			}
		});
	
		if (result.data.error)
			console.log(`Erro ao criar o baralho do Anki: ${result.data.error}`);
	
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

	private createAnkiDecks() {
		console.log("Comandaic")
	}
	private clearArray(array: string[]) {
		while (array.length > 0) {
		  array.pop();
		}
	  }
}

