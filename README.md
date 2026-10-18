# HalfACiv

Um idle medieval inteiramente no terminal. Doze famílias chegam ao Vale da Aurora; cabe a você alimentar a aldeia, erguer uma cidade e reunir apoio suficiente para fundar um reino.

## Jogar

Requer Node.js 18 ou superior. Não há dependências para instalar.

```sh
cd D:\repositorio\HalfACiv
npm start
```

No Windows, também é possível abrir `Jogar.cmd`. Use Windows Terminal ou PowerShell com pelo menos 80 colunas e 24 linhas; 110×36 exibe melhor as artes e os detalhes.

Na primeira vez, enquanto não existe save, um prólogo em três atos apresenta a
queda do antigo reino, a chegada das famílias e o peso da futura coroa, com cenas
ASCII e texto revelado aos poucos. Enter revela o texto e depois avança; Esc pula
para o menu. Com um save, o jogo abre direto no menu; o prólogo continua em
**Rever o prólogo**.
O menu oferece **Continuar domínio**, **Fundar novo domínio**, **Rever o prólogo**,
**Como governar** e **Sair**. Ao fundar, escolha o nome da cidade. Substituir uma
campanha exige confirmação e guarda o save anterior em `saves/realm.json.*.bak`.
Dentro do jogo, `M` ou `Esc` salva e abre o menu, pausando a campanha.

| Tecla | Ação |
| --- | --- |
| Tab / Shift+Tab | Próxima página / página anterior |
| V, na aba Domínio | Alternar panorama e mapa da cidade visto de cima |
| Setas e Enter | Selecionar e construir uma obra ou promulgar uma reforma |
| A / B / C | Escolher uma resposta na página Conselho |
| T | Alternar tributos brandos, moderados e severos |
| P | Reivindicar o próximo título quando cumprir os requisitos |
| Espaço | Mutirão animado: +2 alimento e +1 madeira, no máximo uma vez por segundo |
| PgUp / PgDn | Rolar o conteúdo em terminais menores |
| S | Salvar |
| M / Esc | Salvar, pausar e abrir o menu |
| R, na aba Recrutas | Convocar três candidatos novos por 20 ouro |
| D, na aba Recrutas | Dispensar o membro selecionado, sem reembolso |
| Setas e Enter, na aba Fé | Adotar um credo ou celebrar um rito |
| X | Responder à calamidade em curso |
| Enter, na aba Ajustes | Alternar ilustrações entre ASCII e Unicode |
| Q / Ctrl+C | Salvar e sair |

A aba **Ajustes** troca o conjunto de caracteres das ilustrações. ASCII é o
padrão e funciona em qualquer terminal. Unicode desenha cenas, mapa, brasões,
molduras e barras com linhas, cantos e blocos contínuos, mantendo o mesmo
alinhamento; requer um terminal UTF-8, como o Windows Terminal. A escolha vale
também para o menu e o prólogo e fica em `saves/settings.json`, separada da
campanha. Para conferir sem abrir o jogo: `node index.js --preview 0 --unicode`.

## Como o vale cresce

- **Economia:** hortas alimentam os habitantes; serrarias e pedreiras sustentam obras; feiras e tributos rendem ouro; instituições produzem influência. Trabalhadores insuficientes reduzem a produção. Não é necessário distribuir habitantes manualmente.
- **Sobrevivência:** cada habitante consome alimento. A fome reduz a população, o apoio popular e a legitimidade. A cidade sempre conserva cinco sobreviventes e o mutirão permite recomeçar.
- **Estações:** um dia dura 10 segundos e uma estação, 120 segundos. O inverno reduz a colheita: mantenha reservas ou mais hortas.
- **Política:** camponeses, guildas, clero e nobreza possuem interesses diferentes. As petições mostram os efeitos de cada resposta antes da escolha. Reformas exigem uma coalizão de três facções e modificam a economia e a legitimidade.
- **Progressão:** Aldeia → Vila → Cidade livre → Principado → Reino. Cada título tem requisitos de população, obras, reformas, ouro e reconhecimento político. Chegar a Reino conclui o objetivo desta versão, mas a simulação continua.
- **Fé:** capelas geram devoção. A partir da Vila, com uma capela, a aba **Fé** permite declarar um credo oficial, cada um ligado a uma facção:

  | Credo | Facção | Efeito |
  | --- | --- | --- |
  | Igreja da Aurora | Clero | +15% influência; +0,01 legitimidade/s com alimento |
  | Círculo das Colheitas | Camponeses | +15% alimento; a Bênção dos campos rende +40% |
  | Irmandade dos Ofícios | Guildas | +10% madeira, pedra e ouro |
  | Culto dos Reis Antigos | Nobreza | +10% influência; +6 legitimidade a cada título |

  A primeira declaração custa 25 de influência. Converter custa 80, zera a devoção, tira 15 de apoio da facção da fé antiga e 6 de legitimidade, e só é possível 240 segundos depois da última. A devoção paga ritos: Festa do padroeiro, Bênção dos campos (+25% alimento por 120 s), Peregrinação e Procissão penitente, que encerra febre ou praga.
- **Calamidades:** incêndio, febre, bandidos e praga nas hortas surgem com o jogo aberto, a cada poucos minutos, e drenam recursos, habitantes ou apoio até você responder com `X`. Responder custa recursos, que crescem com o título, e rende apoio e legitimidade. Ignorada por 90 segundos, a calamidade termina cobrando um preço final. O quartel da guarda reduz pela metade o dano dos bandidos. Calamidades não ocorrem durante o progresso offline.
- **Feitos:** dezoito metas permanentes, como fundar o reino, erguer todos os monumentos ou vencer cinco calamidades. Cada feito rende +1% de toda a produção; a lista fica na aba **Crônicas**.
- **Persistência:** autosave a cada 15 segundos e ao sair. Até uma hora de progresso offline, com produção, consumo, estações e fome. Petições aguardam sua decisão; o intendente não escolhe por você. Ao continuar depois de uma ausência, o **Relatório do intendente** mostra quanto cada recurso, a devoção e a população mudaram, além dos feitos conquistados. O jogo não pausa ao navegar entre páginas.

Comece construindo uma segunda horta e uma pedreira em **Obras**. Construa casas para passar de vinte habitantes. Responda às petições no **Conselho**, acumule ouro e reivindique a **Vila** com `P`: isso libera feiras, capelas e as primeiras reformas.

Use `Tab` e `Shift+Tab` para circular entre Domínio, Obras, Conselho, Decretos
e Crônicas, seguidas por **Recrutas** e **Personagem**. Os números continuam disponíveis como opções no menu inicial.
Ao reunir provisões, um trabalhador transporta a carga numa animação ASCII
curta, visível em qualquer página, sem interromper a produção nem os comandos.

Save local: `saves/realm.json`. Faça uma cópia antes de editar manualmente. Para outra campanha, use `HALFACIV_SAVE` apontando para outro arquivo. Um save corrompido é preservado e impede a inicialização, em vez de ser substituído por uma campanha vazia. Evite abrir duas instâncias no mesmo save.

## Desenvolvimento

```sh
npm test
npm run simulate
node index.js --preview
node index.js --preview 2
node index.js --preview menu
node index.js --preview intro
node index.js --preview map
```

`simulate` joga com as mesmas regras, sem recursos extras, para verificar que é possível chegar ao reino. `--preview` renderiza uma página sem terminal interativo e sem tocar no save. `NO_COLOR=1` desativa as cores.

A versão 0.2 entrega uma campanha local com treze construções, cinco reformas, quatro petições com três escolhas cada, quatro facções, recrutamento e cinco estágios. Guerras territoriais, relações entre reinos e sucessão dinástica ficam para futuras versões.

## Obras especiais

Em **Domínio**, `V` alterna entre o panorama e a **planta da cidade**.
O mapa mostra rio, ponte, estrada, praça e lotes de construção. A cerca vira
muralha a partir de Cidade livre. Cada lote ocupado representa um tipo de
obra; o número indica quantas unidades você construiu (`++` para 100 ou mais).
Terrenos sem construção ficam vazios. Obras especiais mantêm suas cores e
animações. A legenda e os indicadores econômicos continuam abaixo do mapa;
use PgUp/PgDn para rolar em terminais menores. A tecla V funciona no Domínio.

As quatro obras únicas ficam no final da lista de Obras. Use as setas para
selecionar e Enter para construir. A cena de Domínio ganha novos sprites
animados conforme você as constrói, com cores próprias sobre o cenário.

| Obra | Disponível em | Efeito |
| --- | --- | --- |
| Moinho dos ventos, dourado | Aldeia | +30% alimento produzido, antes do consumo |
| Forja rubra, vermelho | Vila | +25% madeira e pedra |
| Torre das estrelas, azul | Cidade livre | +40% influência |
| Jardim dos juramentos, violeta | Cidade livre | +0,025 apoio popular/s e +0,01 legitimidade/s, enquanto houver alimento |

## Recrutas e governante

A aba **Recrutas** mostra candidatos com nomes aleatórios, título profissional,
especialização e custo de contrato. Setas selecionam; Enter contrata. O cargo
define o efeito durante a campanha, ativo também no progresso offline:

| Cargo | Efeito base |
| --- | --- |
| Intendente | +15% alimento produzido e +8% receita |
| Guardião das matas | +20% madeira e +10% pedra |
| Mestre de obras | -12% custo de construção |
| Embaixador | +25% influência e +0,006 legitimidade/s com alimento |
| Marechal | +0,025 apoio popular/s com alimento e +10% pedra |
| Cronista | +15% influência e +10% madeira e alimento |

A especialização I, II ou III multiplica os efeitos por 1, 1,25 ou 1,5.
Contratos não cobram salários. Há um personagem por cargo e de dois a seis
lugares no séquito, conforme o estágio territorial. `R` convoca candidatos
novos por 20 ouro; `D` dispensa um contratado e remove seus efeitos.
Os personagens e o estado do sorteio ficam no save: reabrir não troca a lista.

Raramente, cerca de uma vaga em dez, o salão recebe uma **lenda do vale**:
um personagem com nome, cargo e frase próprios, marcado com `* LENDA *`.
Lendas chegam com especialização III, rendem x1,75 do efeito base e custam o
dobro do contrato base. Cada lenda aparece uma vez por séquito, e contratar a
primeira vale o feito **Lenda à mesa**. Há 22 delas, e uma não consegue decidir a
primeira letra do próprio nome.

O topo mostra nome e casa do governante, alinhamento, aprovação média das
quatro facções, séquito e tributos. **Personagem** apresenta o brasão ASCII
da Casa Aurivale, Corvobravo ou Carvalhal, seu lema, atributos, apoio de cada
facção e os bônus em vigor. A casa é sorteada e não concede vantagem econômica.

O governante começa como líder e chega a monarca junto com o reino.
Decisões pró-camponeses favorecem o alinhamento comunalista; privilégios
nobres favorecem o monarquista. No centro, o governante é conciliador.
Os tributos pesam no alinhamento, mas alterná-los não acumula pontos.
A cada quatro decisões ou reformas aprovadas, o atributo praticado sobe
até o limite de 20: gestão melhora receita, diplomacia e erudição melhoram
influência, e comando melhora a recuperação do apoio popular com alimento.
Reformas dos mosteiros praticam erudição; pactos de vassalagem e decisões
de fronteira praticam comando; as outras reformas praticam gestão e as
outras petições, diplomacia.

Saves da versão anterior são migrados ao carregar, preservando nome da cidade,
recursos, construções, população, tempo e crônicas. O governante e os candidatos
são adicionados à campanha existente; não é preciso começar de novo.

## Referência e identidade

Inspirado na ideia de um idle de terminal do [Elden Grid, de localhost-ayu](https://github.com/localhost-ayu/elden-grid). HalfACiv foi implementado do zero: não incorpora código, artes ou interface daquele repositório. As cenas ASCII, a economia de sobrevivência e a progressão política foram criadas para este jogo. Três ideias de mecânica vieram do Elden Grid e foram reescritas para o tema medieval: crises que ficam ativas até o jogador agir (aqui, calamidades), conquistas com bônus permanente de produção (feitos) e o resumo do progresso offline (relatório do intendente).
#   H a l f - A - C i v 
 
 
