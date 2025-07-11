# Ficha de Personagem D&D 5e Interativa


## Descrição do Projeto

Este é um projeto de uma ficha de personagem interativa para Dungeons & Dragons 5ª Edição, desenvolvida inteiramente com tecnologias web front-end. O objetivo é fornecer uma ferramenta dinâmica e fácil de usar para jogadores gerenciarem seus personagens, salvando dados localmente no navegador e integrando com uma API para buscar informações sobre magias.

A ficha é projetada para ser intuitiva e personalizável, oferecendo uma experiência de usuário agradável para acompanhar as estatísticas, habilidades, equipamentos e magias do seu aventureiro.

## Funcionalidades Principais

* **Gerenciamento de Atributos:** Edite Força, Destreza, Constituição, Inteligência, Sabedoria e Carisma, e veja os modificadores calculados automaticamente.
* **Cálculos Automáticos:** Bônus de Proficiência, Iniciativa, Percepção Passiva, Testes de Resistência e Perícias são atualizados dinamicamente com base no nível e atributos.
* **Grimório Interativo:**
    * Busca e adiciona magias diretamente da API D&D 5e (D&D5eAPI).
    * Organiza magias por nível (incluindo truques).
    * Permite visualizar detalhes completos da magia em um modal.
    * Gerenciamento de slots de magia.
* **Persistência de Dados:** Todos os dados da ficha são salvos automaticamente no armazenamento local do navegador (`localStorage`), garantindo que suas informações não sejam perdidas ao recarregar a página.
* **Seleção de Tema Visual:** Alterne entre diferentes temas de classe (Guerreiro, Mago, Bardo, etc.) que alteram a estética da ficha, incluindo cores e animações de fundo.
* **Upload de Retrato:** Personalize sua ficha com uma imagem de retrato do seu personagem.
* **Seções de Combate e Outras Informações:** Campos dedicados para CA, PV, Dados de Vida, Ataques, Características & Traços, Proficiências & Idiomas, e muito mais.

## Tecnologias Utilizadas

* **HTML5:** Estrutura base da ficha.
* **CSS3:** Estilização responsiva e temas visuais.
* **JavaScript (ES6+):** Lógica de interatividade, cálculos, manipulação do DOM e integração com API.
* **D&D5eAPI:** Utilizada para buscar informações detalhadas sobre magias.

## Como Usar / Executar o Projeto

1.  **Clone o Repositório:**
    ```bash
    git clone [https://github.com/SeuUsuario/NomeDoSeuRepositorio.git](https://github.com/SeuUsuario/NomeDoSeuRepositorio.git)
    ```
2.  **Navegue até a Pasta do Projeto:**
    ```bash
    cd NomeDoSeuRepositorio
    ```
3.  **Abra o `index.html`:**
    Simplesmente abra o arquivo `index.html` em seu navegador web preferido (Chrome, Firefox, Edge, etc.). Não é necessário um servidor local para esta aplicação.

## Contribuindo

Contribuições são sempre bem-vindas! Se você tiver ideias para melhorias, novas funcionalidades ou encontrar algum bug, sinta-se à vontade para:

1.  Fazer um **fork** do repositório.
2.  Criar uma nova **branch** para sua feature (`git checkout -b feature/minha-feature`).
3.  Fazer suas alterações e **commitá-las** (`git commit -m 'feat: Adiciona nova funcionalidade X'`).
4.  Fazer um **push** para a branch (`git push origin feature/minha-feature`).
5.  Abrir um **Pull Request**.

## Licença

Este projeto está licenciado sob a Licença MIT. Sinta-se à vontade para usar, modificar e distribuir.

## Créditos e Agradecimentos

* **D&D5eAPI:** Pela API fantástica que torna a busca de magias possível.
* **Flaticon:** Pelos ícones de classe e outros elementos visuais utilizados (mencionar os autores específicos se for um requisito da licença).
    * [Triangle Squad]((https://docs.google.com/document/d/1iSq0vh-PE7jAMr-zPXfbRgvGIb57y-bDwSzD4KtHXs8/edit?usp=sharing))
    * [Smashicons]((https://docs.google.com/document/d/1iSq0vh-PE7jAMr-zPXfbRgvGIb57y-bDwSzD4KtHXs8/edit?usp=sharing))
    * [Leremy]((https://docs.google.com/document/d/1iSq0vh-PE7jAMr-zPXfbRgvGIb57y-bDwSzD4KtHXs8/edit?usp=sharing))
    * [fjstudio]((https://docs.google.com/document/d/1iSq0vh-PE7jAMr-zPXfbRgvGIb57y-bDwSzD4KtHXs8/edit?usp=sharing))
    * [Freepik]((https://docs.google.com/document/d/1iSq0vh-PE7jAMr-zPXfbRgvGIb57y-bDwSzD4KtHXs8/edit?usp=sharing))
    * [Iconic Artisan](https://docs.google.com/document/d/1iSq0vh-PE7jAMr-zPXfbRgvGIb57y-bDwSzD4KtHXs8/edit?usp=sharing)
    * ...
* **Google Fonts:** Pela fonte 'Fondamento' e 'Open Sans'.

---
````
