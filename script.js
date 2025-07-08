document.addEventListener('DOMContentLoaded', () => {

    // Chave para salvar os dados no localStorage. Usar uma constante evita erros de digitação.
    const STORAGE_KEY = 'dndSheetData';

    // Dicionário com informações sobre cada classe. Facilita a expansão no futuro.
    const CLASS_DATA = {
        'warrior': { name: 'Guerreiro', spellcastingAbility: null },
        'wizard': { name: 'Mago', spellcastingAbility: 'int' },
        'bard': { name: 'Bardo', spellcastingAbility: 'cha' },
        'cleric': { name: 'Clérigo', spellcastingAbility: 'wis' },
        'rogue': { name: 'Ladino', spellcastingAbility: null },
        'druid': { name: 'Druida', spellcastingAbility: 'wis' },
        'paladin': { name: 'Paladino', spellcastingAbility: 'cha' },
        'warlock': { name: 'Bruxo', spellcastingAbility: 'cha' },
    };

    // Objeto para guardar o estado atual do personagem.
    let characterState = {
        class: 'warrior', // Classe padrão
        level: 1
    };

    // --- SELETORES DE ELEMENTOS ---
    const proficiencyBonusInput = document.getElementById('proficiency-bonus');
    const initiativeInput = document.getElementById('initiative');
    const passivePerceptionInput = document.getElementById('passive-perception');
    const portraitUploadInput = document.getElementById('portrait-upload');
    const portraitImg = document.getElementById('character-portrait-img');
    const spellSearchInput = document.getElementById('spell-search-input');
    const spellSearchButton = document.getElementById('spell-search-button');
    const spellModal = document.getElementById('spell-modal');
    const spellModalBody = document.getElementById('spell-modal-body');
    const modalCloseButton = document.getElementById('modal-close-button');
    const addSpellToBookButton = document.getElementById('add-spell-to-book-button');
    const spellSaveDcInput = document.getElementById('spell-save-dc');
    const spellAttackBonusInput = document.getElementById('spell-attack-bonus');
    const classNameInput = document.getElementById('class-name');
    const characterLevelInput = document.getElementById('character-level');
    const classSelectionGrid = document.getElementById('class-selection-grid');
    const animationContainer = document.getElementById('animation-container');


    // Variável para guardar os dados da magia atualmente exibida no modal
    let currentSpellData = null;

    // Variável para guardar a lista de todas as magias da API
    let allSpellsList = [];

    // --- FUNÇÕES AUXILIARES ---

    /**
     * Calcula o modificador de um atributo baseado no seu valor.
     * @param {number} score - O valor do atributo (ex: 15).
     * @returns {number} - O modificador calculado (ex: 2).
     */
    function calculateModifier(score) {
        return Math.floor((score - 10) / 2);
    }

    /**
     * Calcula o bônus de proficiência com base no nível do personagem.
     * @param {number} level - O nível do personagem.
     * @returns {number} - O bônus de proficiência.
     */
    function calculateProficiencyBonus(level) {
        if (level >= 17) return 6;
        if (level >= 13) return 5;
        if (level >= 9) return 4;
        if (level >= 5) return 3;
        return 2; // Níveis 1-4
    }

    /**
     * Formata um número para exibir com sinal de + se for positivo.
     * @param {number} bonus - O número a ser formatado.
     * @returns {string} - O bônus formatado (ex: "+2", "-1").
     */
    function formatBonus(bonus) {
        if (bonus >= 0) {
            return `+${bonus}`;
        } else {
            return bonus.toString();
        }
    }

    /**
     * Salva todos os dados preenchíveis da ficha no localStorage do navegador.
     */
    function saveData() {
        const sheetData = {};
        // Seleciona todos os elementos que podem receber input do usuário
        document.querySelectorAll('input:not([readonly]):not([type="file"]), textarea').forEach(element => {
            if (element.type === 'checkbox') {
                sheetData[element.id] = element.checked;
            } else {
                sheetData[element.id] = element.value;
            }
        });
        // Salva a imagem separadamente, pois é um caso especial
        sheetData['character-portrait-img'] = portraitImg.src;

        // Salva a classe e o nível do estado atual
        sheetData.characterClass = characterState.class;

        // Salva as magias do grimório
        document.querySelectorAll('.spell-list').forEach(list => {
            const level = list.id.split('-').pop(); // Pega o número do nível do ID da lista
            const spells = [];
            list.querySelectorAll('li').forEach(li => {
                spells.push(li.textContent.replace(' ✖', '')); // Salva o nome da magia sem o botão de remover
            });
            sheetData[`spell-list-level-${level}`] = spells;
        });

        // Converte o objeto de dados para uma string JSON e salva
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sheetData));
        console.log("Dados da ficha salvos!");
    }

    /**
     * Carrega os dados do localStorage e preenche a ficha.
     */
    function loadData() {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            // O bloco try...catch protege a aplicação caso os dados salvos estejam corrompidos.
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

                // Carrega a classe e o nível, atualizando o estado
                characterState.class = sheetData.characterClass || 'warrior';
                characterState.level = parseInt(sheetData['character-level']) || 1;
                classNameInput.value = CLASS_DATA[characterState.class].name;
                characterLevelInput.value = characterState.level;

                // Aplica o tema salvo ao carregar a página
                applyTheme(characterState.class);

                // Carrega as magias do grimório
                for (let i = 0; i <= 9; i++) {
                    const spellList = sheetData[`spell-list-level-${i}`];
                    if (spellList && spellList.length > 0) {
                        spellList.forEach(spellName => {
                            addSpellToDom(i, spellName);
                        });
                    }
                }
                console.log("Dados da ficha carregados!");
            } catch (error) {
                console.error("Erro ao carregar dados da ficha do localStorage:", error);
            }
        }
    }

    // --- MODAL FUNCTIONS ---

    function openModal() {
        spellModal.classList.add('visible');
    }

    function closeModal() {
        spellModal.classList.remove('visible');
    }

    /**
     * Aplica a classe de tema ao body e atualiza o ícone ativo.
     * @param {string} className - O nome da classe (ex: 'wizard').
     */
    function applyTheme(className) {
        // 1. Limpa qualquer animação anterior
        animationContainer.innerHTML = '';

        // Remove TODAS as classes de tema existentes do body para evitar sobreposição
        document.body.classList.remove('theme-warrior', 'theme-wizard', 'theme-bard', 'theme-cleric', 'theme-rogue', 'theme-druid', 'theme-paladin', 'theme-warlock');
        // Adiciona a nova classe de tema
        document.body.classList.add(`theme-${className}`);

        // 2. Gera novas animações se for um tema especial
        if (className === 'wizard') {
            const numRunes = 40; // Aumente este número para um efeito mais denso!
            // Array de runas individuais para um efeito mais aleatório
            const runeCharacters = 'ᛝᛟᚹᛗᛞᚠᚱᚷᛢᛏᛒᛖᛜᛚ'.split('');

            for (let i = 0; i < numRunes; i++) {
                const runeStream = document.createElement('span');
                runeStream.className = 'rune-stream';
                runeStream.textContent = runeCharacters[Math.floor(Math.random() * runeCharacters.length)]; // Pega uma runa aleatória
                
                // Estilos aleatórios para um efeito mais natural
                runeStream.style.left = `${Math.random() * 100}vw`;
                runeStream.style.fontSize = `${1 + Math.random() * 1.5}em`;
                runeStream.style.animationDuration = `${10 + Math.random() * 20}s`;
                runeStream.style.animationDelay = `${Math.random() * 10}s`;
                
                animationContainer.appendChild(runeStream);
            }

            // Adicionando fumaça azulada para o Mago
            const numSmokeWizard = 36; // O triplo de fumaça!
            for (let i = 0; i < numSmokeWizard; i++) {
                const smoke = document.createElement('span');
                smoke.className = 'smoke-puff';
                // Posiciona a fumaça nos lados esquerdo e direito, não no meio
                if (Math.random() < 0.5) {
                    // Lado esquerdo (0% a 30% da largura da tela)
                    smoke.style.left = `${Math.random() * 30}vw`;
                } else {
                    // Lado direito (70% a 100% da largura da tela)
                    smoke.style.left = `${70 + Math.random() * 30}vw`;
                }
                smoke.style.width = `${60 + Math.random() * 120}px`;
                smoke.style.height = smoke.style.width;
                smoke.style.backgroundColor = 'rgba(42, 57, 80, 0.3)'; // Fumaça mais opaca
                smoke.style.filter = 'blur(30px)';
                smoke.style.animation = `rise-smoke ${10 + Math.random() * 15}s linear infinite ${Math.random() * 10}s`;
                animationContainer.appendChild(smoke);
            }
        } else if (className === 'bard') {
            const numNotes = 15; // Aumente para mais notas!
            const notes = ['♪', '♫', '♩', '♬'];
            for (let i = 0; i < numNotes; i++) {
                const noteStream = document.createElement('span');
                noteStream.className = 'note-stream';
                noteStream.textContent = notes[Math.floor(Math.random() * notes.length)];
                
                // Estilos aleatórios
                noteStream.style.left = `${Math.random() * 100}vw`;
                noteStream.style.fontSize = `${1.5 + Math.random() * 2}em`;
                noteStream.style.animationDuration = `${8 + Math.random() * 15}s`;
                noteStream.style.animationDelay = `${Math.random() * 8}s`;
                
                animationContainer.appendChild(noteStream);
            }

            // Adicionando fumaça roxa para o Bardo
            const numSmokeBard = 36; // O triplo de fumaça!
            for (let i = 0; i < numSmokeBard; i++) {
                const smoke = document.createElement('span');
                smoke.className = 'smoke-puff';
                // Posiciona a fumaça nos lados esquerdo e direito, não no meio
                if (Math.random() < 0.5) {
                    // Lado esquerdo (0% a 30% da largura da tela)
                    smoke.style.left = `${Math.random() * 30}vw`;
                } else {
                    // Lado direito (70% a 100% da largura da tela)
                    smoke.style.left = `${70 + Math.random() * 30}vw`;
                }
                smoke.style.width = `${60 + Math.random() * 120}px`;
                smoke.style.height = smoke.style.width;
                smoke.style.backgroundColor = 'rgba(72, 61, 139, 0.3)'; // Fumaça mais opaca
                smoke.style.filter = 'blur(30px)';
                smoke.style.animation = `rise-smoke ${10 + Math.random() * 15}s linear infinite ${Math.random() * 10}s`;
                animationContainer.appendChild(smoke);
            }
        } else if (className === 'rogue') {
            const numShadows = 15;
            for (let i = 0; i < numShadows; i++) {
                const shadow = document.createElement('div');
                shadow.className = 'flickering-shadow';

                // Posiciona as sombras em locais aleatórios
                shadow.style.left = `${Math.random() * 100}vw`;
                shadow.style.top = `${Math.random() * 100}vh`;
                shadow.style.width = `${200 + Math.random() * 300}px`; // Sombras maiores
                shadow.style.height = shadow.style.width;
                shadow.style.animationDelay = `${Math.random() * 8}s`;
                animationContainer.appendChild(shadow);
            }
        } else if (className === 'druid') {
            const numVines = 25;
            for (let i = 0; i < numVines; i++) {
                const vine = document.createElement('div');
                vine.className = 'vine';

                vine.style.left = `${Math.random() * 100}vw`;
                // Duração da animação aleatória
                vine.style.animationDuration = `${10 + Math.random() * 15}s`;
                // Atraso para começar a animação
                vine.style.animationDelay = `${Math.random() * 10}s`;
                // Tamanho aleatório
                vine.style.transform = `scaleX(${0.5 + Math.random() * 0.8})`;
                animationContainer.appendChild(vine);
            }
        } else if (className === 'paladin') {
            const numBeams = 10;
            for (let i = 0; i < numBeams; i++) {
                const beam = document.createElement('div');
                beam.className = 'blessing-beam';

                beam.style.left = `${Math.random() * 100}vw`;
                beam.style.top = `-${Math.random() * 50}vh`; // Começa acima da tela
                beam.style.transform = `rotate(${-10 + Math.random() * 20}deg)`;
                beam.style.animationDuration = `${8 + Math.random() * 8}s`; // Animação lenta
                beam.style.animationDelay = `${Math.random() * 10}s`;

                animationContainer.appendChild(beam);
            }
        } else if (className === 'warlock') {
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
                
                animationContainer.appendChild(pulse);
            }
        } else if (className === 'cleric') {
            const numRays = 12;
            for (let i = 0; i < numRays; i++) {
                const ray = document.createElement('div');
                ray.className = 'divine-ray';
                
                ray.style.left = `${5 + Math.random() * 90}vw`; // Evita que os raios fiquem colados nas bordas
                ray.style.top = `-${Math.random() * 50}vh`; // Começa acima da tela
                ray.style.transform = `rotate(${-15 + Math.random() * 30}deg)`;
                ray.style.animationDuration = `${4 + Math.random() * 6}s`;
                ray.style.animationDelay = `${Math.random() * 5}s`;
                animationContainer.appendChild(ray);
            }
            // Adicionando uma névoa sagrada
            const numHolyMist = 10;
            for (let i = 0; i < numHolyMist; i++) {
                const smoke = document.createElement('span');
                smoke.className = 'smoke-puff';
                smoke.style.left = `${Math.random() * 100}vw`;
                smoke.style.backgroundColor = 'rgba(255, 215, 0, 0.15)'; // Névoa dourada e sutil
                smoke.style.animation = `rise-smoke ${12 + Math.random() * 15}s linear infinite ${Math.random() * 12}s`;
                animationContainer.appendChild(smoke);
            }
        } else if (className === 'warrior') {
            const numSparks = 50; // Mais faíscas
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

                animationContainer.appendChild(spark);
            }

            const numSmoke = 45; // O triplo de fumaça!
            for (let i = 0; i < numSmoke; i++) {
                const smoke = document.createElement('span');
                smoke.className = 'smoke-puff';

                // Posiciona a fumaça nos lados esquerdo e direito, não no meio
                if (Math.random() < 0.5) {
                    // Lado esquerdo (0% a 30% da largura da tela)
                    smoke.style.left = `${Math.random() * 30}vw`;
                } else {
                    // Lado direito (70% a 100% da largura da tela)
                    smoke.style.left = `${70 + Math.random() * 30}vw`;
                }
                smoke.style.width = `${50 + Math.random() * 100}px`;
                smoke.style.height = smoke.style.width;
                smoke.style.backgroundColor = 'rgba(80, 80, 80, 0.3)'; // Fumaça mais opaca
                smoke.style.borderRadius = '50%';
                smoke.style.filter = 'blur(25px)';
                smoke.style.animation = `rise-smoke ${8 + Math.random() * 10}s linear infinite ${Math.random() * 8}s`;
                animationContainer.appendChild(smoke);
            }
        }

        // Atualiza qual ícone está "ativo"
        document.querySelectorAll('.class-icon-button').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.class === className) {
                btn.classList.add('active');
            }
        });
    }

    // --- API FUNCTIONS ---

    /**
     * Busca a lista de todas as magias da API e armazena localmente.
     * Executada uma vez ao carregar a página para otimizar as buscas.
     */
    async function fetchAllSpells() {
        try {
            const response = await fetch('https://www.dnd5eapi.co/api/spells');
            const data = await response.json();
            allSpellsList = data.results;
            console.log("Lista de magias carregada com sucesso!");
        } catch (error) {
            console.error("Falha ao carregar a lista de magias da API:", error);
            // Poderíamos exibir uma mensagem para o usuário aqui
        }
    }

    /**
     * Busca os detalhes de uma magia na D&D 5e API e os exibe no pop-up.
     */
    async function searchSpell() {
        const userInput = spellSearchInput.value.trim().toLowerCase();
        if (!userInput) {
            alert("Por favor, digite o nome de uma magia.");
            return;
        }

        // Procura na lista local a magia que corresponde ao input do usuário
        const foundSpell = allSpellsList.find(spell => spell.name.toLowerCase() === userInput);

        if (!foundSpell) {
            alert(`Magia "${spellSearchInput.value}" não encontrada. Verifique o nome e tente novamente.`);
            return;
        }

        const apiUrl = `https://www.dnd5eapi.co${foundSpell.url}`; // A API já fornece a URL correta

        try {
            spellSearchButton.textContent = "Buscando...";
            spellSearchButton.disabled = true;

            const response = await fetch(apiUrl);
            const spellData = await response.json();
            currentSpellData = spellData; // Armazena os dados da magia

            // Constrói o conteúdo HTML para o pop-up
            let spellHTML = `<h2>${spellData.name}</h2>`;
            spellHTML += `<p><em>Nível ${spellData.level} de ${spellData.school.name}</em></p>`;
            spellHTML += `<p><strong>Tempo de Conjuração:</strong> ${spellData.casting_time}</p>`;
            spellHTML += `<p><strong>Alcance:</strong> ${spellData.range}</p>`;
            spellHTML += `<p><strong>Componentes:</strong> ${spellData.components.join(', ')}</p>`; // V, S, M
            spellHTML += `<p><strong>Duração:</strong> ${spellData.duration}</p><hr>`;
            // A descrição é um array de parágrafos, então juntamos todos.
            spellData.desc.forEach(p => { spellHTML += `<p>${p}</p>`; }); 
            if (spellData.higher_level?.length) {
                spellHTML += `<hr><p><strong>Em Níveis Superiores:</strong></p>`;
                spellData.higher_level.forEach(p => { spellHTML += `<p>${p}</p>`; });
            }

            spellModalBody.innerHTML = spellHTML;
            openModal();

        } catch (error) {
            alert(error.message);
        } finally {
            spellSearchButton.textContent = "Buscar";
            spellSearchButton.disabled = false;
        }
    }

    /**
     * Adiciona uma magia ao grimório na interface (DOM).
     * @param {number} level - O nível da magia.
     * @param {string} name - O nome da magia.
     */
    function addSpellToDom(level, name) {
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
    }

    // Função para o botão "Adicionar ao Grimório"
    function addCurrentSpellToBook() {
        if (currentSpellData) {
            const level = currentSpellData.level;
            const name = currentSpellData.name;
            addSpellToDom(level, name);
            saveData(); // Salva a ficha após adicionar a nova magia
            closeModal();
        }
    }

    // --- FUNÇÃO PRINCIPAL DE ATUALIZAÇÃO ---

    /**
     * Lê todos os valores base, recalcula tudo e atualiza a ficha inteira.
     */
    function updateAll() {
        // 1. ATUALIZAR ESTADO E CALCULAR BÔNUS DE PROFICIÊNCIA
        characterState.level = parseInt(characterLevelInput.value) || 1;
        const level = characterState.level;
        
        const proficiencyBonus = calculateProficiencyBonus(level);
        proficiencyBonusInput.value = formatBonus(proficiencyBonus);

        // 2. LER VALORES DE ATRIBUTO E CALCULAR MODIFICADORES
        const modifiers = {};
        document.querySelectorAll('.ability-score-group').forEach(group => {
            const scoreInput = group.querySelector('.ability-score-input');
            const modInput = group.querySelector('.ability-modifier-box');
            const abilityName = group.dataset.ability; // Usa o 'data-ability' do HTML

            const score = parseInt(scoreInput.value) || 10;
            const modifier = calculateModifier(score);

            modifiers[abilityName] = modifier;
            modInput.value = formatBonus(modifier);
        });

        // 3. ATUALIZAR TESTES DE RESISTÊNCIA
        document.querySelectorAll('.saving-throws-list li').forEach(li => {
            const checkbox = li.querySelector('.proficiency-checkbox');
            const valueInput = li.querySelector('.save-value');
            const abilityName = li.dataset.ability;

            let totalBonus = modifiers[abilityName];
            if (checkbox.checked) {
                totalBonus += proficiencyBonus;
            }
            valueInput.value = formatBonus(totalBonus);
        });

        // 4. ATUALIZAR PERÍCIAS (E PERCEPÇÃO PASSIVA)
        let perceptionBonus = 0;
        document.querySelectorAll('.skills-list li').forEach(li => {
            const checkbox = li.querySelector('.proficiency-checkbox');
            const valueInput = li.querySelector('.skill-value');
            const abilityName = li.dataset.ability;

            let totalBonus = modifiers[abilityName];
            if (checkbox.checked) {
                totalBonus += proficiencyBonus;
            }
            valueInput.value = formatBonus(totalBonus);

            if (li.id === 'perception-skill-li') {
                perceptionBonus = totalBonus;
            }
        });

        // 5. ATUALIZAR ESTATÍSTICAS DE COMBATE
        initiativeInput.value = formatBonus(modifiers.dex);
        passivePerceptionInput.value = 10 + perceptionBonus;

        // 6. ATUALIZAR VISIBILIDADE E ESTATÍSTICAS DE MAGIA
        const spellcastingBlock = document.querySelector('[data-class-feature="spellcasting"]');
        const classInfo = CLASS_DATA[characterState.class];

        if (classInfo && classInfo.spellcastingAbility) {
            const spellcastingAbilityName = classInfo.spellcastingAbility;
            const spellcastingModifier = modifiers[spellcastingAbilityName];

            spellcastingBlock.classList.remove('hidden');
            document.querySelector('.spellcasting-block h3').textContent = `Magias de ${classInfo.name}`;
            document.getElementById('spellcasting-ability').value = spellcastingAbilityName.toUpperCase();
            spellSaveDcInput.value = 8 + proficiencyBonus + spellcastingModifier;
            spellAttackBonusInput.value = formatBonus(proficiencyBonus + spellcastingModifier);
        } else {
            spellcastingBlock.classList.add('hidden');
        }

        // 6. SALVAR DADOS APÓS TODAS AS ATUALIZAÇÕES
        saveData();
    }

    // --- ADICIONAR "OUVINTES" DE EVENTOS ---

    // Lista de todos os inputs que devem disparar a atualização geral
    const inputsToWatch = [
        ...document.querySelectorAll('.ability-score-input'),
        ...document.querySelectorAll('.proficiency-checkbox'),
        characterLevelInput,
        ...document.querySelectorAll('textarea')
    ];

    // Adiciona o ouvinte a cada um dos inputs da lista
    inputsToWatch.forEach(input => {
        const eventType = (input.type === 'checkbox') ? 'change' : 'input';
        input.addEventListener(eventType, updateAll);
    });

    // Adiciona o ouvinte para o botão de busca de magia
    spellSearchButton.addEventListener('click', searchSpell);

    // Adiciona o ouvinte para o botão de adicionar magia ao grimório
    addSpellToBookButton.addEventListener('click', addCurrentSpellToBook);

    // Adiciona o ouvinte para a seleção de classe (usando delegação de evento)
    classSelectionGrid.addEventListener('click', (event) => {
        const classButton = event.target.closest('.class-icon-button');
        if (classButton) {
            const newClass = classButton.dataset.class;
            characterState.class = newClass;
            classNameInput.value = CLASS_DATA[characterState.class].name;
            applyTheme(newClass);
            updateAll(); // Atualiza a ficha inteira com a nova classe
        }
    });


    // Adiciona o ouvinte para o upload do retrato
    portraitUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                // Quando o arquivo for lido, define o resultado como o src da imagem
                portraitImg.src = e.target.result;
                // Salva os dados imediatamente após a troca da imagem
                saveData();
            };
            // Lê o arquivo como uma Data URL (texto base64)
            reader.readAsDataURL(file);
        }
    });

    // --- OUVINTES PARA FECHAR O MODAL ---
    modalCloseButton.addEventListener('click', closeModal);

    // Função genérica para fechar modais clicando no fundo
    function closeOnOverlayClick(event) {
        if (event.target.classList.contains('modal-overlay')) {
            closeModal();
        }
    }
    spellModal.addEventListener('click', closeOnOverlayClick);

    window.addEventListener('keydown', (event) => {
        // Fecha qualquer modal visível com a tecla Esc
        if (event.key === 'Escape' && spellModal.classList.contains('visible')) {
            closeModal();
        }
    });

    // --- EXECUÇÃO INICIAL ---    
    // 0. Busca a lista de todas as magias em segundo plano
    fetchAllSpells();

    // 1. Carrega os dados salvos primeiro.
    loadData();

    // 2. Em seguida, chama updateAll() para calcular todos os campos derivados
    // (modificadores, bônus, etc.) com base nos dados carregados.
    updateAll();
});
