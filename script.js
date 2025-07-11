document.addEventListener('DOMContentLoaded', () => {

    // --- CONSTANTES ---
    const STORAGE_KEY = 'dndSheetData';
    const CLASS_DATA = {
        'neutral': { name: 'Neutro', spellcastingAbility: null },
        'warrior': { name: 'Guerreiro', spellcastingAbility: null },
        'wizard': { name: 'Mago', spellcastingAbility: 'int' },
        'bard': { name: 'Bardo', spellcastingAbility: 'cha' },
        'cleric': { name: 'Clérigo', spellcastingAbility: 'wis' },
        'rogue': { name: 'Ladino', spellcastingAbility: null },
        'druid': { name: 'Druida', spellcastingAbility: 'wis' },
        'paladin': { name: 'Paladino', spellcastingAbility: 'cha' },
        'warlock': { name: 'Bruxo', spellcastingAbility: 'cha' },
    };
    const RUNE_CHARACTERS = 'ᛝᛟᚹᛗᛞᚠᚱᚷᛢᛏᛒᛖᛜᛚ'.split('');
    const MUSIC_NOTES = ['♪', '♫', '♩', '♬'];

    // --- ESTADO GLOBAL DO PERSONAGEM ---
    let characterState = {
        class: 'neutral',
        level: 1
    };
    let currentSpellData = null; // Guarda os dados da magia atualmente exibida no modal
    let allSpellsList = [];     // Guarda a lista de todas as magias da API

    // --- SELETORES DE ELEMENTOS (Agrupados para clareza e fácil acesso) ---
    const DOM = {
        proficiencyBonusInput: document.getElementById('proficiency-bonus'),
        initiativeInput: document.getElementById('initiative'),
        passivePerceptionInput: document.getElementById('passive-perception'),
        portraitUploadInput: document.getElementById('portrait-upload'),
        portraitImg: document.getElementById('character-portrait-img'),
        spellSearchInput: document.getElementById('spell-search-input'),
        spellSearchButton: document.getElementById('spell-search-button'),
        spellModal: document.getElementById('spell-modal'),
        spellModalBody: document.getElementById('spell-modal-body'),
        modalCloseButton: document.getElementById('modal-close-button'),
        addSpellToBookButton: document.getElementById('add-spell-to-book-button'),
        spellSaveDcInput: document.getElementById('spell-save-dc'),
        spellAttackBonusInput: document.getElementById('spell-attack-bonus'),
        classNameInput: document.getElementById('class-name'),
        characterLevelInput: document.getElementById('character-level'),
        classSelectionGrid: document.getElementById('class-selection-grid'),
        animationContainer: document.getElementById('animation-container'),
        spellcastingBlock: document.querySelector('[data-class-feature="spellcasting"]'),
        spellcastingAbilityInput: document.getElementById('spellcasting-ability'),
        spellcastingBlockTitle: document.querySelector('.spellcasting-block h3'),
        allAbilityScoreInputs: document.querySelectorAll('.ability-score-input'),
        allProficiencyCheckboxes: document.querySelectorAll('.proficiency-checkbox'),
        allTextareas: document.querySelectorAll('textarea'),
        allSavingThrowItems: document.querySelectorAll('.saving-throws-list li'),
        allSkillItems: document.querySelectorAll('.skills-list li'),
    };

    // --- FUNÇÕES AUXILIARES DE CÁLCULO E FORMATAÇÃO ---

    /**
     * Calcula o modificador de um atributo.
     * @param {number} score - O valor do atributo.
     * @returns {number} - O modificador calculado.
     */
    const calculateModifier = score => Math.floor((score - 10) / 2);

    /**
     * Calcula o bônus de proficiência baseado no nível.
     * @param {number} level - O nível do personagem.
     * @returns {number} - O bônus de proficiência.
     */
    const calculateProficiencyBonus = level => {
        if (level >= 17) return 6;
        if (level >= 13) return 5;
        if (level >= 9) return 4;
        if (level >= 5) return 3;
        return 2; // Níveis 1-4
    };

    /**
     * Formata um número para exibir com sinal (+ se positivo).
     * @param {number} bonus - O número a ser formatado.
     * @returns {string} - O bônus formatado.
     */
    const formatBonus = bonus => (bonus >= 0 ? `+${bonus}` : bonus.toString());

    // --- FUNÇÕES DE PERSISTÊNCIA DE DADOS ---

    /**
     * Salva todos os dados preenchíveis da ficha no localStorage.
     */
    const saveData = () => {
        const sheetData = {};
        document.querySelectorAll('input:not([readonly]):not([type="file"]), textarea').forEach(element => {
            sheetData[element.id] = element.type === 'checkbox' ? element.checked : element.value;
        });
        sheetData['character-portrait-img'] = DOM.portraitImg.src;
        sheetData.characterClass = characterState.class;

        // Salva as magias do grimório
        document.querySelectorAll('.spell-list').forEach(list => {
            const level = list.id.split('-').pop();
            sheetData[`spell-list-level-${level}`] = Array.from(list.querySelectorAll('li')).map(li =>
                li.textContent.replace(' ✖', '')
            );
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(sheetData));
        console.log("Dados da ficha salvos!");
    };

    /**
     * Carrega os dados do localStorage e preenche a ficha.
     */
    const loadData = () => {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (!savedData) return;

        try {
            const sheetData = JSON.parse(savedData);
            for (const id in sheetData) {
                const element = document.getElementById(id);
                if (element) {
                    if (element.tagName === 'IMG') {
                        element.src = sheetData[id];
                    } else if (element.type === 'checkbox') {
                        element.checked = sheetData[id];
                    } else {
                        element.value = sheetData[id];
                    }
                }
            }

            characterState.class = sheetData.characterClass || 'neutral';
            characterState.level = parseInt(sheetData['character-level']) || 1;
            DOM.characterLevelInput.value = characterState.level;

            applyTheme(characterState.class);

            for (let i = 0; i <= 9; i++) {
                const spellList = sheetData[`spell-list-level-${i}`];
                if (spellList && spellList.length > 0) {
                    spellList.forEach(spellName => addSpellToDom(i, spellName));
                }
            }
            console.log("Dados da ficha carregados!");
        } catch (error) {
            console.error("Erro ao carregar dados da ficha do localStorage:", error);
        }
    };

    // --- FUNÇÕES DO MODAL ---

    const openModal = () => DOM.spellModal.classList.add('visible');
    const closeModal = () => DOM.spellModal.classList.remove('visible');

    // --- FUNÇÕES DE ANIMAÇÃO E TEMA ---

    /**
     * Gera um puff de fumaça com propriedades aleatórias.
     * @param {string} color - Cor da fumaça (ex: 'rgba(42, 57, 80, 0.3)').
     * @param {number} count - Quantidade de puffs a gerar.
     */
    const generateSmokePuffs = (color, count) => {
        for (let i = 0; i < count; i++) {
            const smoke = document.createElement('span');
            smoke.className = 'smoke-puff';
            // Posiciona a fumaça nos lados esquerdo e direito, não no meio
            smoke.style.left = `${(Math.random() < 0.5 ? Math.random() * 30 : 70 + Math.random() * 30)}vw`;
            smoke.style.width = `${60 + Math.random() * 120}px`;
            smoke.style.height = smoke.style.width;
            smoke.style.backgroundColor = color;
            smoke.style.filter = 'blur(30px)';
            smoke.style.animation = `rise-smoke ${10 + Math.random() * 15}s linear infinite ${Math.random() * 10}s`;
            DOM.animationContainer.appendChild(smoke);
        }
    };

    /**
     * Mapeia nomes de classe para funções de geração de animação.
     * Isso simplifica a lógica de `applyTheme`.
     */
    const animationGenerators = {
        wizard: () => {
            const numRunes = 40;
            for (let i = 0; i < numRunes; i++) {
                const runeStream = document.createElement('span');
                runeStream.className = 'rune-stream';
                runeStream.textContent = RUNE_CHARACTERS[Math.floor(Math.random() * RUNE_CHARACTERS.length)];
                runeStream.style.left = `${Math.random() * 100}vw`;
                runeStream.style.fontSize = `${1 + Math.random() * 1.5}em`;
                runeStream.style.animationDuration = `${10 + Math.random() * 20}s`;
                runeStream.style.animationDelay = `${Math.random() * 10}s`;
                DOM.animationContainer.appendChild(runeStream);
            }
            generateSmokePuffs('rgba(42, 57, 80, 0.3)', 36);
        },
        bard: () => {
            const numNotes = 15;
            for (let i = 0; i < numNotes; i++) {
                const noteStream = document.createElement('span');
                noteStream.className = 'note-stream';
                noteStream.textContent = MUSIC_NOTES[Math.floor(Math.random() * MUSIC_NOTES.length)];
                noteStream.style.left = `${Math.random() * 100}vw`;
                noteStream.style.fontSize = `${1.5 + Math.random() * 2}em`;
                noteStream.style.animationDuration = `${8 + Math.random() * 15}s`;
                noteStream.style.animationDelay = `${Math.random() * 8}s`;
                DOM.animationContainer.appendChild(noteStream);
            }
            generateSmokePuffs('rgba(72, 61, 139, 0.3)', 36);
        },
        rogue: () => {
            const numShadows = 15;
            for (let i = 0; i < numShadows; i++) {
                const shadow = document.createElement('div');
                shadow.className = 'flickering-shadow';
                shadow.style.left = `${Math.random() * 100}vw`;
                shadow.style.top = `${Math.random() * 100}vh`;
                shadow.style.width = `${200 + Math.random() * 300}px`;
                shadow.style.height = shadow.style.width;
                shadow.style.animationDelay = `${Math.random() * 8}s`;
                DOM.animationContainer.appendChild(shadow);
            }
        },
        druid: () => {
            const numVines = 25;
            for (let i = 0; i < numVines; i++) {
                const vine = document.createElement('div');
                vine.className = 'vine';
                vine.style.left = `${Math.random() * 100}vw`;
                vine.style.animationDuration = `${10 + Math.random() * 15}s`;
                vine.style.animationDelay = `${Math.random() * 10}s`;
                vine.style.transform = `scaleX(${0.5 + Math.random() * 0.8})`;
                DOM.animationContainer.appendChild(vine);
            }
        },
        paladin: () => {
            const numBeams = 10;
            for (let i = 0; i < numBeams; i++) {
                const beam = document.createElement('div');
                beam.className = 'blessing-beam';
                beam.style.left = `${Math.random() * 100}vw`;
                beam.style.top = `-${Math.random() * 50}vh`;
                beam.style.transform = `rotate(${-10 + Math.random() * 20}deg)`;
                beam.style.animationDuration = `${8 + Math.random() * 8}s`;
                beam.style.animationDelay = `${Math.random() * 10}s`;
                DOM.animationContainer.appendChild(beam);
            }
        },
        warlock: () => {
            const numPulses = 15;
            for (let i = 0; i < numPulses; i++) {
                const pulse = document.createElement('div');
                pulse.className = 'eldritch-pulse';
                pulse.style.left = `${Math.random() * 100}vw`;
                pulse.style.top = `${Math.random() * 100}vh`;
                pulse.style.width = `${50 + Math.random() * 150}px`;
                pulse.style.height = pulse.style.width;
                pulse.style.animationDuration = `${5 + Math.random() * 5}s`;
                pulse.style.animationDelay = `${Math.random() * 10}s`;
                DOM.animationContainer.appendChild(pulse);
            }
        },
        cleric: () => {
            const numRays = 12;
            for (let i = 0; i < numRays; i++) {
                const ray = document.createElement('div');
                ray.className = 'divine-ray';
                ray.style.left = `${5 + Math.random() * 90}vw`;
                ray.style.top = `-${Math.random() * 50}vh`;
                ray.style.transform = `rotate(${-15 + Math.random() * 30}deg)`;
                ray.style.animationDuration = `${4 + Math.random() * 6}s`;
                ray.style.animationDelay = `${Math.random() * 5}s`;
                DOM.animationContainer.appendChild(ray);
            }
            generateSmokePuffs('rgba(255, 215, 0, 0.15)', 10); // Névoa dourada e sutil
        },
        warrior: () => {
            const numSparks = 50;
            for (let i = 0; i < numSparks; i++) {
                const spark = document.createElement('span');
                spark.className = 'spark';
                spark.style.left = `${Math.random() * 100}vw`;
                spark.style.width = `${1 + Math.random() * 3}px`;
                spark.style.height = spark.style.width;
                spark.style.backgroundColor = '#ffae42';
                spark.style.borderRadius = '50%';
                spark.style.boxShadow = '0 0 10px #ffae42, 0 0 20px #ff4500';
                spark.style.animation = `rise-spark ${2 + Math.random() * 4}s linear infinite`;
                spark.style.animationDelay = `${Math.random() * 5}s`;
                DOM.animationContainer.appendChild(spark);
            }
            generateSmokePuffs('rgba(80, 80, 80, 0.3)', 45); // Fumaça mais opaca
        },
        neutral: () => { /* Nenhuma animação específica para o tema neutro */ }
    };

    /**
     * Aplica a classe de tema ao body e gera as animações correspondentes.
     * @param {string} className - O nome da classe (ex: 'wizard').
     */
    const applyTheme = className => {
        // 1. Limpa animações existentes e classes de tema do body
        DOM.animationContainer.innerHTML = '';
        const allThemeClasses = Object.keys(CLASS_DATA).map(key => `theme-${key}`);
        document.body.classList.remove(...allThemeClasses);

        // 2. Gerencia o estado do input de classe
        const isNeutral = className === 'neutral';
        DOM.classNameInput.readOnly = !isNeutral;

        if (isNeutral) {
            DOM.classNameInput.placeholder = 'Sua Classe';
            DOM.classNameInput.value = ''; // Limpa o nome da classe se for neutro
        } else {
            // Adiciona o tema e define o nome da classe
            document.body.classList.add(`theme-${className}`);
            DOM.classNameInput.value = CLASS_DATA[className].name;
            DOM.classNameInput.placeholder = '';
        }

        // 3. Gera as animações correspondentes ao tema, se houver uma função definida
        if (animationGenerators[className]) {
            animationGenerators[className]();
        }

        // 4. Atualiza qual ícone de classe está "ativo"
        document.querySelectorAll('.class-icon-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.class === className);
        });
    };

    // --- FUNÇÕES DE API ---

    /**
     * Busca a lista de todas as magias da API D&D 5e e armazena localmente.
     */
    const fetchAllSpells = async () => {
        try {
            const response = await fetch('https://www.dnd5eapi.co/api/spells');
            const data = await response.json();
            allSpellsList = data.results;
            console.log("Lista de magias carregada com sucesso!");
        } catch (error) {
            console.error("Falha ao carregar a lista de magias da API:", error);
        }
    };

    /**
     * Busca os detalhes de uma magia específica na API.
     * @param {string} spellUrl - A URL relativa da magia na API.
     * @returns {Promise<Object>} - Os dados detalhados da magia.
     */
    const fetchSpellDetails = async (spellUrl) => {
        try {
            DOM.spellSearchButton.textContent = "Buscando...";
            DOM.spellSearchButton.disabled = true;
            const response = await fetch(`https://www.dnd5eapi.co${spellUrl}`);
            return await response.json();
        } catch (error) {
            console.error("Erro ao buscar detalhes da magia:", error);
            throw new Error(`Falha ao buscar detalhes da magia: ${error.message}`);
        } finally {
            DOM.spellSearchButton.textContent = "Buscar";
            DOM.spellSearchButton.disabled = false;
        }
    };

    /**
     * Constrói e exibe o conteúdo da magia no modal.
     * @param {Object} spellData - Os dados detalhados da magia.
     */
    const renderSpellModal = (spellData) => {
        let spellHTML = `<h2>${spellData.name}</h2>`;
        spellHTML += `<p><em>Nível ${spellData.level} de ${spellData.school.name}</em></p>`;
        spellHTML += `<p><strong>Tempo de Conjuração:</strong> ${spellData.casting_time}</p>`;
        spellHTML += `<p><strong>Alcance:</strong> ${spellData.range}</p>`;
        spellHTML += `<p><strong>Componentes:</strong> ${spellData.components.join(', ')}</p>`;
        spellHTML += `<p><strong>Duração:</strong> ${spellData.duration}</p><hr>`;

        spellData.desc.forEach(p => { spellHTML += `<p>${p}</p>`; });

        if (spellData.higher_level?.length) {
            spellHTML += `<hr><p><strong>Em Níveis Superiores:</strong></p>`;
            spellData.higher_level.forEach(p => { spellHTML += `<p>${p}</p>`; });
        }
        DOM.spellModalBody.innerHTML = spellHTML;
        openModal();
    };

    /**
     * Lida com a busca de magias e exibe os resultados no modal.
     */
    const searchSpell = async () => {
        const userInput = DOM.spellSearchInput.value.trim().toLowerCase();
        if (!userInput) {
            alert("Por favor, digite o nome de uma magia.");
            return;
        }

        const foundSpell = allSpellsList.find(spell => spell.name.toLowerCase() === userInput);
        if (!foundSpell) {
            alert(`Magia "${DOM.spellSearchInput.value}" não encontrada. Verifique o nome e tente novamente.`);
            return;
        }

        try {
            currentSpellData = await fetchSpellDetails(foundSpell.url);
            renderSpellModal(currentSpellData);
        } catch (error) {
            alert(error.message);
        }
    };

    /**
     * Adiciona uma magia ao grimório na interface (DOM).
     * @param {number} level - O nível da magia.
     * @param {string} name - O nome da magia.
     */
    const addSpellToDom = (level, name) => {
        const spellList = document.getElementById(`spell-list-level-${level}`);
        if (spellList) {
            const li = document.createElement('li');
            li.textContent = name;

            const removeBtn = document.createElement('span');
            removeBtn.textContent = ' ✖';
            removeBtn.className = 'remove-spell-btn';
            removeBtn.onclick = () => {
                li.remove();
                saveData(); // Salva a ficha após remover a magia
            };

            li.appendChild(removeBtn);
            spellList.appendChild(li);
        }
    };

    /**
     * Adiciona a magia atualmente exibida no modal ao grimório.
     */
    const addCurrentSpellToBook = () => {
        if (currentSpellData) {
            addSpellToDom(currentSpellData.level, currentSpellData.name);
            saveData();
            closeModal();
        }
    };

    // --- FUNÇÕES DE ATUALIZAÇÃO DA FICHA ---

    /**
     * Atualiza o bônus de proficiência com base no nível do personagem.
     * @returns {number} - O bônus de proficiência calculado.
     */
    const updateProficiencyBonus = () => {
        characterState.level = parseInt(DOM.characterLevelInput.value) || 1;
        const proficiencyBonus = calculateProficiencyBonus(characterState.level);
        DOM.proficiencyBonusInput.value = formatBonus(proficiencyBonus);
        return proficiencyBonus;
    };

    /**
     * Lê os valores dos atributos, calcula e exibe seus modificadores.
     * @returns {Object} - Um objeto com os modificadores dos atributos.
     */
    const updateAbilityModifiers = () => {
        const modifiers = {};
        document.querySelectorAll('.ability-score-group').forEach(group => {
            const scoreInput = group.querySelector('.ability-score-input');
            const modInput = group.querySelector('.ability-modifier-box');
            const abilityName = group.dataset.ability;

            const score = parseInt(scoreInput.value) || 10;
            const modifier = calculateModifier(score);

            modifiers[abilityName] = modifier;
            modInput.value = formatBonus(modifier);
        });
        return modifiers;
    };

    /**
     * Atualiza os valores de testes de resistência e perícias.
     * @param {NodeListOf<Element>} elements - Lista de elementos (li) a serem atualizados.
     * @param {Object} modifiers - Objeto com os modificadores dos atributos.
     * @param {number} proficiencyBonus - O bônus de proficiência.
     */
    const updateDerivedValues = (elements, modifiers, proficiencyBonus) => {
        elements.forEach(li => {
            const checkbox = li.querySelector('.proficiency-checkbox');
            const valueInput = li.querySelector('.save-value, .skill-value'); // Seleciona ambos
            const abilityName = li.dataset.ability;

            let totalBonus = modifiers[abilityName];
            // Verifica se o checkbox existe e está marcado
            if (checkbox?.checked) {
                totalBonus += proficiencyBonus;
            }
            valueInput.value = formatBonus(totalBonus);
        });
    };

    /**
     * Atualiza as estatísticas de combate (Iniciativa e Percepção Passiva).
     * @param {Object} modifiers - Objeto com os modificadores dos atributos.
     */
    const updateCombatStats = (modifiers) => {
        DOM.initiativeInput.value = formatBonus(modifiers.dex);
        const perceptionSkillLi = document.getElementById('perception-skill-li');
        // Pega o valor da perícia de Percepção e converte para número
        const perceptionBonus = parseInt(perceptionSkillLi.querySelector('.skill-value').value);
        DOM.passivePerceptionInput.value = 10 + perceptionBonus;
    };

    /**
     * Atualiza a visibilidade e os valores do bloco de magia com base na classe.
     * @param {Object} modifiers - Objeto com os modificadores dos atributos.
     * @param {number} proficiencyBonus - O bônus de proficiência.
     */
    const updateSpellcastingBlock = (modifiers, proficiencyBonus) => {
        const classInfo = CLASS_DATA[characterState.class];
        const isNeutral = characterState.class === 'neutral';

        if (classInfo && classInfo.spellcastingAbility) { // Classes com magias pré-definidas
            const spellcastingAbilityName = classInfo.spellcastingAbility;
            const spellcastingModifier = modifiers[spellcastingAbilityName];

            DOM.spellcastingBlock.classList.remove('hidden');
            DOM.spellcastingBlockTitle.textContent = `Magias de ${classInfo.name}`;
            DOM.spellcastingAbilityInput.value = spellcastingAbilityName.toUpperCase();
            DOM.spellSaveDcInput.value = 8 + proficiencyBonus + spellcastingModifier;
            DOM.spellAttackBonusInput.value = formatBonus(proficiencyBonus + spellcastingModifier);

            // Garante que os campos calculados não sejam editáveis
            DOM.spellcastingAbilityInput.readOnly = true;
            DOM.spellSaveDcInput.readOnly = true;
            DOM.spellAttackBonusInput.readOnly = true;
        } else if (isNeutral) { // Tema neutro, com autonomia para o usuário preencher
            DOM.spellcastingBlock.classList.remove('hidden');
            DOM.spellcastingBlockTitle.textContent = 'Magias';

            // Permite que o usuário edite os campos de magia
            DOM.spellcastingAbilityInput.readOnly = false;
            DOM.spellSaveDcInput.readOnly = false;
            DOM.spellAttackBonusInput.readOnly = false;
        } else { // Classes sem magia (Guerreiro, Ladino, etc.)
            DOM.spellcastingBlock.classList.add('hidden');
        }
    };

    /**
     * Função principal que lê todos os valores base, recalcula tudo e atualiza a ficha inteira.
     */
    const updateAll = () => {
        // Sequência de atualização:
        const proficiencyBonus = updateProficiencyBonus();
        const modifiers = updateAbilityModifiers();

        updateDerivedValues(DOM.allSavingThrowItems, modifiers, proficiencyBonus); // Atualiza Testes de Resistência
        updateDerivedValues(DOM.allSkillItems, modifiers, proficiencyBonus);       // Atualiza Perícias

        updateCombatStats(modifiers);
        updateSpellcastingBlock(modifiers, proficiencyBonus);

        saveData(); // Salva os dados após todas as atualizações
    };

    // --- CONFIGURAÇÃO DE OUVINTES DE EVENTOS ---

    /**
     * Configura todos os ouvintes de evento para a aplicação.
     */
    const setupEventListeners = () => {
        // Eventos que disparam a atualização geral da ficha
        [
            ...DOM.allAbilityScoreInputs,
            ...DOM.allProficiencyCheckboxes,
            DOM.characterLevelInput,
            ...DOM.allTextareas // Para salvar o que é digitado em textareas
        ].forEach(input => {
            const eventType = (input.type === 'checkbox') ? 'change' : 'input';
            input.addEventListener(eventType, updateAll);
        });

        // Ouvintes para funcionalidades do modal de magias
        DOM.spellSearchButton.addEventListener('click', searchSpell);
        DOM.addSpellToBookButton.addEventListener('click', addCurrentSpellToBook);
        DOM.modalCloseButton.addEventListener('click', closeModal);
        DOM.spellModal.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal-overlay')) {
                closeModal();
            }
        });
        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && DOM.spellModal.classList.contains('visible')) {
                closeModal();
            }
        });

        // Ouvinte para seleção de classe (usando delegação de evento para performance)
        DOM.classSelectionGrid.addEventListener('click', (event) => {
            const classButton = event.target.closest('.class-icon-button');
            if (classButton) {
                characterState.class = classButton.dataset.class;
                applyTheme(characterState.class);
                updateAll();
            }
        });

        // Ouvinte para upload da imagem do retrato
        DOM.portraitUploadInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    DOM.portraitImg.src = e.target.result;
                    saveData(); // Salva a ficha imediatamente após a troca da imagem
                };
                reader.readAsDataURL(file); // Lê o arquivo como uma Data URL (base64)
            }
        });
    };

    // --- FUNÇÃO DE INICIALIZAÇÃO DA APLICAÇÃO ---

    /**
     * Inicializa a aplicação: busca dados da API, carrega dados salvos
     * e configura os ouvintes de evento.
     */
    const initializeApp = async () => {
        await fetchAllSpells(); // Garante que a lista de magias esteja carregada
        loadData();             // Carrega dados salvos do localStorage
        updateAll();            // Calcula e atualiza todos os campos derivados com base nos dados carregados
        setupEventListeners();  // Configura todos os ouvintes de evento
    };

    // Inicia a aplicação quando o DOM estiver completamente carregado
    initializeApp();
});