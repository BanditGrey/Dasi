# Plano de trabalho — mapas modulares

Este plano acompanha a evolução dos 56 cenários. A cobertura do editor **não** significa que o sistema de mapas ou a arte final estejam concluídos. Cada etapa deve ter testes, documentação e, quando aplicável, revisão visual antes de ser marcada como concluída.

## Estado atual

- [x] 56 concepts individuais e 56 blockouts GLB procedurais iniciais; não são arte final aprovada.
- [x] Editor visual em 56 cenários, com duas camadas por célula e persistência local/JSON; nas arenas circulares apenas o interior é editável.
- [x] Exportação de GLB visual estático separado dos arquivos-base e lote ZIP com os 56 cenários e manifesto; não exporta colisões ou dinâmica.
- [ ] Revisão visual dos cenários e da exportação no navegador, em todos os biomas.

## Lista ordenada

1. **Confiabilidade do editor e da exportação**
   - [x] Exercitar todos os 56 cenários com edições de piso e objeto e verificar os snapshots exportáveis, mantendo cobertura dos formatos especiais.
   - [x] Serializar e recarregar GLBs editados dos 56 cenários, incluindo superfícies especiais; verificar peças, cores e transformações. Teste automatizado não substitui revisão visual.
   - [ ] Testar os fluxos de edição, importação, exportação individual e em lote e troca de cenário no navegador; registrar capturas e defeitos.
   - [ ] Medir tempo de geração, tamanho dos arquivos, memória e quadros por segundo em cenários representativos, especialmente EVT_03 e pisos grandes.
2. **Bordas e superfícies especiais**
   - [ ] Criar peças de borda recortadas para círculos e octógonos sem ultrapassar a geometria original nem preencher abismos.
   - [ ] Implementar e testar a mecânica real de lajes e ponte, com edições acompanhando mudanças de estado e colisões correspondentes.
3. **Catálogo modular e direção artística**
   - [ ] Evoluir os protótipos atuais para peças de piso, paredes, vegetação e estruturas com modelos e variantes por bioma, conectores e rotação.
   - [ ] Fazer acabamento dos 56 cenários contra os concepts e revisar iluminação, escala, navegabilidade e identidade de cada bioma.
4. **Formato compartilhado e colisões**
   - [ ] Projetar e documentar um formato versionado para peças, transformações, camadas e colisores, separado do JSON visual experimental.
   - [ ] Validar IDs, limites, versões, colisores, perigos e spawn no servidor; rejeitar documentos inválidos antes da publicação.
   - [ ] Integrar mapas aprovados ao servidor e cliente com paridade de colisão, testes de movimento e migração segura do catálogo atual.
5. **Persistência e publicação**
   - [ ] Criar armazenamento no servidor, controle de versões, permissões e publicação/rollback; não confiar no localStorage como fonte autoritativa.
   - [ ] Integrar GLBs e dados aprovados ao pipeline de build e distribuição; testar reconexão e consistência entre jogadores.
6. **Entrega**
   - [ ] Fazer revisão visual e funcional dos 56 cenários, testes automatizados e de carga, e documentar pendências e critérios de aceite.

## Critérios gerais

Nenhum módulo visual deve ser declarado colisor até ser validado e carregado pelo servidor. Não preencher vazios nem alterar spawn ou perigos silenciosamente. GLB estático não substitui dados de colisão nem comportamento dinâmico. Mudanças de conteúdo publicadas devem ser reproduzíveis e reversíveis. O servidor atual continua sendo um protótipo sem autenticação real, persistência completa ou autoridade integral de posição.

A preparação da próxima etapa está em [Plano_Personagens.md](../art/Plano_Personagens.md); isso não encerra as pendências dos mapas.
