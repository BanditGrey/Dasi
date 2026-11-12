using System;
using System.IO;
using System.Net.Sockets;
using System.Diagnostics;
using System.Drawing;
using System.Windows.Forms;
using System.Threading;
using System.Runtime.InteropServices;
using System.Text;

namespace DasiLauncher
{
    public class MainForm : Form
    {
        // ========================================================
        // Configurações e Cores do Tema Continent of Legend (Dark MMORPG)
        // ========================================================
        private static readonly Color ColorBgDark = Color.FromArgb(18, 20, 26);
        private static readonly Color ColorCardBg = Color.FromArgb(28, 32, 42);
        private static readonly Color ColorCardBorder = Color.FromArgb(48, 54, 70);
        private static readonly Color ColorGold = Color.FromArgb(212, 175, 55);
        private static readonly Color ColorGoldHover = Color.FromArgb(240, 205, 95);
        private static readonly Color ColorTextLight = Color.FromArgb(240, 242, 245);
        private static readonly Color ColorTextMuted = Color.FromArgb(154, 160, 176);
        private static readonly Color ColorSuccess = Color.FromArgb(46, 204, 113);
        private static readonly Color ColorWarning = Color.FromArgb(241, 196, 15);
        private static readonly Color ColorDanger = Color.FromArgb(231, 76, 60);
        private static readonly Color ColorConsoleBg = Color.FromArgb(12, 14, 18);

        // Processos gerenciados
        private Process serverProcess = null;
        private Process phpProcess = null;
        private System.Windows.Forms.Timer statusTimer;
        private NotifyIcon trayIcon;
        private ContextMenuStrip trayMenu;

        // Controles de UI
        private Label lblHeaderTitle;
        private Label lblHeaderSub;
        private Label lblStatusBadge;
        private Label lblNodeVersion;
        private Label lblPhpVersion;
        private Label lblPortStatus;
        private ComboBox cboEngine;
        private CheckBox chkDevControls;
        private CheckBox chkAppMode;
        private NumericUpDown numPort;
        private Button btnStartGame;
        private Button btnStopServer;
        private Button btnRestartServer;
        private Button btnOpenViewer;
        private Button btnOpenValidator;
        private Button btnBuildGlb;
        private Button btnOpenFolder;
        private TextBox txtConsole;
        private Button btnClearLogs;

        // Caminhos detectados
        private string rootDir;
        private string nodePath = "node";
        private string phpPath = "php";
        private string edgePath = "";
        private bool isNodeAvailable = false;
        private bool isPhpAvailable = false;

        public MainForm()
        {
            InitializePaths();
            InitializeComponent();
            CheckEnvironment();

            // Timer de monitoramento contínuo da porta
            statusTimer = new System.Windows.Forms.Timer();
            statusTimer.Interval = 2000;
            statusTimer.Tick += (s, e) => UpdateServerStatus();
            statusTimer.Start();
        }

        private void InitializePaths()
        {
            // Diretório raiz do Dasi (normalmente a pasta pai de tools/launcher ou a pasta do .exe)
            string exeDir = AppDomain.CurrentDomain.BaseDirectory;
            if (File.Exists(Path.Combine(exeDir, "package.json")))
            {
                rootDir = exeDir;
            }
            else if (File.Exists(Path.Combine(exeDir, "..", "..", "package.json")))
            {
                rootDir = Path.GetFullPath(Path.Combine(exeDir, "..", ".."));
            }
            else
            {
                rootDir = exeDir;
            }

            // Detectar caminhos de Node.js se não estiver no PATH global
            string defaultNode = @"C:\Program Files\nodejs\node.exe";
            if (File.Exists(defaultNode)) nodePath = defaultNode;

            // Detectar caminhos comuns de PHP
            string[] commonPhpPaths = new string[] {
                @"C:\php\php.exe",
                @"C:\tools\php\php.exe",
                @"C:\xampp\php\php.exe",
                @"D:\xampp\php\php.exe",
                @"C:\laragon\bin\php\current\php.exe"
            };
            foreach (string p in commonPhpPaths)
            {
                if (File.Exists(p)) { phpPath = p; break; }
            }

            // Detectar Microsoft Edge para modo App imersivo
            string edgeX86 = @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe";
            string edgeX64 = @"C:\Program Files\Microsoft\Edge\Application\msedge.exe";
            if (File.Exists(edgeX86)) edgePath = edgeX86;
            else if (File.Exists(edgeX64)) edgePath = edgeX64;
        }

        private void InitializeComponent()
        {
            this.Text = "DASI — Continent of Legend Reimagined (Launcher & Launcher EXE)";
            this.Size = new Size(1020, 720);
            this.MinimumSize = new Size(960, 640);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = ColorBgDark;
            this.ForeColor = ColorTextLight;
            this.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);

            // Carregar ícone se existir
            string iconPath = Path.Combine(rootDir, "tools", "launcher", "dasi.ico");
            if (File.Exists(iconPath))
            {
                try { this.Icon = new Icon(iconPath); } catch { }
            }

            // ========================================================
            // Layout Principal: Top Header, Center Dashboard, Bottom Console
            // ========================================================
            Panel pnlHeader = new Panel
            {
                Dock = DockStyle.Top,
                Height = 84,
                BackColor = Color.FromArgb(22, 25, 33),
                Padding = new Padding(24, 16, 24, 16)
            };

            lblHeaderTitle = new Label
            {
                Text = "⚔️ DASI — Continent of Legend Reimagined",
                Font = new Font("Segoe UI Semibold", 16f, FontStyle.Bold),
                ForeColor = ColorGold,
                AutoSize = true,
                Location = new Point(20, 14)
            };

            lblHeaderSub = new Label
            {
                Text = "Painel Oficial de Controle • Servidor Autoritativo Node.js / Suporte PHP • 3D Dev Viewer",
                Font = new Font("Segoe UI", 9f),
                ForeColor = ColorTextMuted,
                AutoSize = true,
                Location = new Point(24, 46)
            };

            lblStatusBadge = new Label
            {
                Text = "● OFFLINE",
                Font = new Font("Segoe UI Bold", 10.5f, FontStyle.Bold),
                ForeColor = ColorDanger,
                BackColor = Color.FromArgb(38, 24, 28),
                TextAlign = ContentAlignment.MiddleCenter,
                Size = new Size(130, 36),
                Anchor = AnchorStyles.Top | AnchorStyles.Right,
                Location = new Point(pnlHeader.Width - 160, 24)
            };
            pnlHeader.Resize += (s, e) => {
                lblStatusBadge.Location = new Point(pnlHeader.Width - 150, 24);
            };

            pnlHeader.Controls.Add(lblHeaderTitle);
            pnlHeader.Controls.Add(lblHeaderSub);
            pnlHeader.Controls.Add(lblStatusBadge);

            // Painel Superior de Status e Controles (Grid/Cards)
            Panel pnlBody = new Panel
            {
                Dock = DockStyle.Fill,
                Padding = new Padding(20, 14, 20, 14),
                AutoScroll = true
            };

            // Card 1: Ambiente e Runtimes
            GroupBox grpEnv = CreateGroupBox("🔍 Status do Ambiente & Runtimes", 20, 10, 460, 140);
            lblNodeVersion = new Label { Text = "Node.js: Verificando...", Location = new Point(16, 28), AutoSize = true, ForeColor = ColorTextLight };
            lblPhpVersion = new Label { Text = "PHP: Verificando...", Location = new Point(16, 56), AutoSize = true, ForeColor = ColorTextLight };
            lblPortStatus = new Label { Text = "Porta 8080: Livre", Location = new Point(16, 84), AutoSize = true, ForeColor = ColorTextLight };
            
            grpEnv.Controls.Add(lblNodeVersion);
            grpEnv.Controls.Add(lblPhpVersion);
            grpEnv.Controls.Add(lblPortStatus);

            // Card 2: Opções de Inicialização
            GroupBox grpConfig = CreateGroupBox("⚙️ Configurações de Execução", 500, 10, 470, 140);
            grpConfig.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;

            Label lblEngine = new Label { Text = "Engine:", Location = new Point(16, 30), AutoSize = true, ForeColor = ColorTextMuted };
            cboEngine = new ComboBox
            {
                Location = new Point(80, 26),
                Width = 260,
                DropDownStyle = ComboBoxStyle.DropDownList,
                BackColor = ColorCardBg,
                ForeColor = ColorTextLight,
                FlatStyle = FlatStyle.Flat
            };
            cboEngine.Items.Add("Node.js (GameServer Canônico)");
            cboEngine.Items.Add("PHP Built-in Server (router.php)");
            cboEngine.Items.Add("Dual Engine (Node + PHP)");
            cboEngine.SelectedIndex = 0;

            chkDevControls = new CheckBox
            {
                Text = "Ativar DASI_DEV_CONTROLS=1 (Modo GM/Dev)",
                Location = new Point(16, 64),
                AutoSize = true,
                ForeColor = ColorGold,
                Checked = true
            };

            chkAppMode = new CheckBox
            {
                Text = "Modo Janela Imersiva (Edge Standalone App)",
                Location = new Point(16, 92),
                AutoSize = true,
                ForeColor = ColorTextLight,
                Checked = !string.IsNullOrEmpty(edgePath)
            };

            Label lblPort = new Label { Text = "Porta:", Location = new Point(346, 30), AutoSize = true, ForeColor = ColorTextMuted };
            numPort = new NumericUpDown
            {
                Location = new Point(390, 26),
                Width = 70,
                Minimum = 1000,
                Maximum = 65535,
                Value = 8080,
                BackColor = ColorCardBg,
                ForeColor = ColorTextLight
            };
            numPort.ValueChanged += (s, e) => UpdateServerStatus();

            grpConfig.Controls.Add(lblEngine);
            grpConfig.Controls.Add(cboEngine);
            grpConfig.Controls.Add(lblPort);
            grpConfig.Controls.Add(numPort);
            grpConfig.Controls.Add(chkDevControls);
            grpConfig.Controls.Add(chkAppMode);

            // Painel de Botões Principais de Ação
            Panel pnlActions = new Panel
            {
                Location = new Point(20, 160),
                Height = 120,
                Width = 950,
                Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right
            };

            btnStartGame = CreateButton("🚀 INICIAR SERVIDOR & JOGAR", 0, 0, 310, 52, ColorGold, ColorBgDark, true);
            btnStartGame.Click += (s, e) => StartServerAndOpenGame();

            btnOpenViewer = CreateButton("🌐 Abrir Dev Viewer (3D)", 325, 0, 200, 52, ColorCardBg, ColorTextLight, false);
            btnOpenViewer.Click += (s, e) => OpenUrl("http://localhost:" + GetSelectedPort());

            btnOpenValidator = CreateButton("🧪 Validador 3D (Workbench)", 540, 0, 210, 52, ColorCardBg, ColorGold, false);
            btnOpenValidator.Click += (s, e) => OpenUrl("http://localhost:" + GetSelectedPort() + "/validator.html");

            btnStopServer = CreateButton("⏹️ Parar Servidor", 765, 0, 185, 52, Color.FromArgb(60, 25, 25), ColorDanger, false);
            btnStopServer.Click += (s, e) => StopAllServers();

            // Linha secundária de utilitários
            btnRestartServer = CreateButton("🔄 Reiniciar", 0, 64, 150, 42, ColorCardBg, ColorTextLight, false);
            btnRestartServer.Click += (s, e) => RestartServer();

            btnBuildGlb = CreateButton("🛠️ Build GLBs 3D", 165, 64, 160, 42, ColorCardBg, ColorTextLight, false);
            btnBuildGlb.Click += (s, e) => RunBuildGlb();

            btnOpenFolder = CreateButton("📂 Abrir Pasta Raiz", 340, 64, 160, 42, ColorCardBg, ColorTextLight, false);
            btnOpenFolder.Click += (s, e) => Process.Start("explorer.exe", rootDir);

            Button btnClearCache = CreateButton("🧹 Limpar Portas/Cache", 515, 64, 185, 42, ColorCardBg, ColorTextMuted, false);
            btnClearCache.Click += (s, e) => KillPortProcesses(GetSelectedPort());

            btnClearLogs = CreateButton("📄 Limpar Logs", 715, 64, 140, 42, ColorCardBg, ColorTextMuted, false);
            btnClearLogs.Click += (s, e) => { txtConsole.Clear(); AppendLog("Log do console limpo."); };

            pnlActions.Controls.Add(btnStartGame);
            pnlActions.Controls.Add(btnOpenViewer);
            pnlActions.Controls.Add(btnOpenValidator);
            pnlActions.Controls.Add(btnStopServer);
            pnlActions.Controls.Add(btnRestartServer);
            pnlActions.Controls.Add(btnBuildGlb);
            pnlActions.Controls.Add(btnOpenFolder);
            pnlActions.Controls.Add(btnClearCache);
            pnlActions.Controls.Add(btnClearLogs);

            // Seção de Logs / Console em Tempo Real
            Label lblConsoleTitle = new Label
            {
                Text = "📋 Console de Execução & Logs em Tempo Real (GameServer / PHP):",
                Location = new Point(20, 290),
                AutoSize = true,
                ForeColor = ColorTextMuted
            };

            txtConsole = new TextBox
            {
                Location = new Point(20, 316),
                Size = new Size(950, 240),
                Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right,
                Multiline = true,
                ScrollBars = ScrollBars.Vertical,
                ReadOnly = true,
                BackColor = ColorConsoleBg,
                ForeColor = Color.FromArgb(180, 230, 180),
                Font = new Font("Consolas", 9f),
                BorderStyle = BorderStyle.FixedSingle
            };

            pnlBody.Controls.Add(grpEnv);
            pnlBody.Controls.Add(grpConfig);
            pnlBody.Controls.Add(pnlActions);
            pnlBody.Controls.Add(lblConsoleTitle);
            pnlBody.Controls.Add(txtConsole);

            this.Controls.Add(pnlBody);
            this.Controls.Add(pnlHeader);

            // ========================================================
            // Configuração da Bandeja do Sistema (Tray Icon)
            // ========================================================
            trayMenu = new ContextMenuStrip();
            trayMenu.Items.Add("⚔️ Abrir Dasi Launcher", null, (s, e) => RestoreFromTray());
            trayMenu.Items.Add("🌐 Abrir Dev Viewer", null, (s, e) => OpenUrl("http://localhost:" + GetSelectedPort()));
            trayMenu.Items.Add("-");
            trayMenu.Items.Add("⏹️ Parar Servidores", null, (s, e) => StopAllServers());
            trayMenu.Items.Add("❌ Sair", null, (s, e) => { StopAllServers(); Application.Exit(); });

            trayIcon = new NotifyIcon
            {
                Text = "Dasi MMORPG Launcher",
                ContextMenuStrip = trayMenu,
                Visible = true
            };
            if (this.Icon != null) trayIcon.Icon = this.Icon;
            trayIcon.DoubleClick += (s, e) => RestoreFromTray();

            this.FormClosing += (s, e) => {
                StopAllServers();
                if (trayIcon != null) trayIcon.Dispose();
            };

            AppendLog("Dasi Launcher inicializado com sucesso.");
            AppendLog("Pasta Raiz: " + rootDir);
        }

        private GroupBox CreateGroupBox(string title, int x, int y, int width, int height)
        {
            return new GroupBox
            {
                Text = title,
                Location = new Point(x, y),
                Size = new Size(width, height),
                ForeColor = ColorGold,
                BackColor = ColorCardBg,
                FlatStyle = FlatStyle.Flat
            };
        }

        private Button CreateButton(string text, int x, int y, int width, int height, Color bg, Color fg, bool isBold)
        {
            Button btn = new Button
            {
                Text = text,
                Location = new Point(x, y),
                Size = new Size(width, height),
                BackColor = bg,
                ForeColor = fg,
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand,
                Font = new Font("Segoe UI", isBold ? 10.5f : 9f, isBold ? FontStyle.Bold : FontStyle.Regular)
            };
            btn.FlatAppearance.BorderSize = 1;
            btn.FlatAppearance.BorderColor = ColorCardBorder;
            return btn;
        }

        private int GetSelectedPort()
        {
            if (numPort != null && numPort.Value >= 1000)
                return (int)numPort.Value;
            return 8080;
        }

        // ========================================================
        // Checagem de Ambiente (Node, PHP, Edge)
        // ========================================================
        private void CheckEnvironment()
        {
            // Checar Node.js
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo(nodePath, "--version")
                {
                    RedirectStandardOutput = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                using (Process p = Process.Start(psi))
                {
                    string output = p.StandardOutput.ReadToEnd().Trim();
                    p.WaitForExit();
                    if (!string.IsNullOrEmpty(output))
                    {
                        lblNodeVersion.Text = "🟢 Node.js: " + output + " (Pronto)";
                        isNodeAvailable = true;
                    }
                }
            }
            catch
            {
                lblNodeVersion.Text = "🔴 Node.js: Não encontrado no PATH";
                isNodeAvailable = false;
            }

            // Checar PHP
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo(phpPath, "-v")
                {
                    RedirectStandardOutput = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                using (Process p = Process.Start(psi))
                {
                    string output = p.StandardOutput.ReadLine();
                    p.WaitForExit();
                    if (!string.IsNullOrEmpty(output))
                    {
                        lblPhpVersion.Text = "🟢 PHP: " + output.Split('(')[0].Trim() + " (Disponível)";
                        isPhpAvailable = true;
                    }
                }
            }
            catch
            {
                lblPhpVersion.Text = "⚪ PHP: Não detectado (Opcional - Node.js é o nativo)";
                isPhpAvailable = false;
            }

            UpdateServerStatus();
        }

        private bool IsPortInUse(int port)
        {
            try
            {
                using (TcpClient client = new TcpClient())
                {
                    IAsyncResult result = client.BeginConnect("127.0.0.1", port, null, null);
                    bool success = result.AsyncWaitHandle.WaitOne(300);
                    if (success && client.Connected)
                    {
                        client.EndConnect(result);
                        return true;
                    }
                    return false;
                }
            }
            catch
            {
                return false;
            }
        }

        private void UpdateServerStatus()
        {
            int port = GetSelectedPort();
            bool online = IsPortInUse(port);
            if (this.InvokeRequired)
            {
                this.Invoke(new Action(UpdateServerStatus));
                return;
            }

            if (online)
            {
                lblStatusBadge.Text = "● ONLINE";
                lblStatusBadge.ForeColor = ColorSuccess;
                lblStatusBadge.BackColor = Color.FromArgb(20, 45, 25);
                lblPortStatus.Text = string.Format("🟢 Porta {0}: ATIVA (http://localhost:{0})", port);
            }
            else
            {
                lblStatusBadge.Text = "● OFFLINE";
                lblStatusBadge.ForeColor = ColorDanger;
                lblStatusBadge.BackColor = Color.FromArgb(45, 20, 25);
                lblPortStatus.Text = string.Format("⚪ Porta {0}: Livre para iniciar", port);
            }
        }

        // ========================================================
        // Gerenciamento e Inicialização de Servidores
        // ========================================================
        private void StartServerAndOpenGame()
        {
            int port = GetSelectedPort();
            if (IsPortInUse(port))
            {
                AppendLog(string.Format("Porta {0} já está ativa! Abrindo interface do jogo...", port));
                OpenGameWindow();
                return;
            }

            int selectedEngine = cboEngine.SelectedIndex; // 0=Node, 1=PHP, 2=Dual

            if ((selectedEngine == 0 || selectedEngine == 2) && !isNodeAvailable)
            {
                AppendLog("❌ Node.js não foi encontrado no sistema! Instale o Node.js 22+ ou verifique o PATH.");
                MessageBox.Show("Node.js não foi detectado no sistema.\n\nInstale o Node.js versão 22 ou superior para rodar o GameServer nativo de Dasi.", "Node.js Não Encontrado", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            if (selectedEngine == 1 && !isPhpAvailable)
            {
                AppendLog("❌ PHP CLI não foi detectado no sistema!");
                MessageBox.Show("O interpretador PHP (php.exe) não foi encontrado no PATH nem nos diretórios padrão.\n\nUtilize a Engine Node.js ou adicione o PHP ao PATH do sistema.", "PHP Não Encontrado", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            AppendLog("Iniciando Dasi Server (Engine: " + cboEngine.Text + ")...");
            lblStatusBadge.Text = "● INICIANDO...";
            lblStatusBadge.ForeColor = ColorWarning;

            ThreadPool.QueueUserWorkItem((state) =>
            {
                try
                {
                    if (selectedEngine == 0 || selectedEngine == 2)
                    {
                        // Iniciar GameServer Node.js
                        StartNodeServer(port);
                    }

                    if (selectedEngine == 1 || (selectedEngine == 2 && isPhpAvailable))
                    {
                        // Iniciar Servidor PHP
                        StartPhpServer(selectedEngine == 1 ? port : (port + 1));
                    }

                    // Aguardar porta subir
                    int attempts = 0;
                    bool ready = false;
                    while (attempts < 25)
                    {
                        Thread.Sleep(500);
                        if (IsPortInUse(port))
                        {
                            ready = true;
                            break;
                        }
                        attempts++;
                    }

                    if (ready)
                    {
                        AppendLog(string.Format("✅ Servidor pronto e escutando na porta {0}!", port));
                        this.Invoke(new Action(() => {
                            UpdateServerStatus();
                            OpenGameWindow();
                        }));
                    }
                    else
                    {
                        AppendLog(string.Format("⚠️ Tempo limite ao aguardar inicialização da porta {0}.", port));
                    }
                }
                catch (Exception ex)
                {
                    AppendLog("❌ Erro ao iniciar servidor: " + ex.Message);
                }
            });
        }

        private void StartNodeServer(int port)
        {
            ProcessStartInfo psi = new ProcessStartInfo
            {
                FileName = nodePath,
                Arguments = "--experimental-strip-types src/server/network/GameServer.ts",
                WorkingDirectory = rootDir,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
                StandardOutputEncoding = Encoding.UTF8,
                StandardErrorEncoding = Encoding.UTF8
            };

            psi.EnvironmentVariables["PORT"] = port.ToString();
            if (chkDevControls.Checked)
            {
                psi.EnvironmentVariables["DASI_DEV_CONTROLS"] = "1";
            }

            serverProcess = new Process { StartInfo = psi, EnableRaisingEvents = true };
            serverProcess.OutputDataReceived += (s, e) => { if (!string.IsNullOrEmpty(e.Data)) AppendLog("[GameServer] " + e.Data); };
            serverProcess.ErrorDataReceived += (s, e) => { if (!string.IsNullOrEmpty(e.Data)) AppendLog("[GameServer:ERR] " + e.Data); };

            serverProcess.Start();
            serverProcess.BeginOutputReadLine();
            serverProcess.BeginErrorReadLine();
            AppendLog("Processo Node.js PID " + serverProcess.Id + " disparado.");
        }

        private void StartPhpServer(int port)
        {
            string routerPath = Path.Combine(rootDir, "tools", "php_server", "router.php");
            if (!File.Exists(routerPath))
            {
                AppendLog("Arquivo router.php não encontrado em: " + routerPath);
                return;
            }

            ProcessStartInfo psi = new ProcessStartInfo
            {
                FileName = phpPath,
                Arguments = string.Format("-S 127.0.0.1:{0} \"{1}\"", port, routerPath),
                WorkingDirectory = rootDir,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
                StandardOutputEncoding = Encoding.UTF8,
                StandardErrorEncoding = Encoding.UTF8
            };

            phpProcess = new Process { StartInfo = psi, EnableRaisingEvents = true };
            phpProcess.OutputDataReceived += (s, e) => { if (!string.IsNullOrEmpty(e.Data)) AppendLog("[PHP] " + e.Data); };
            phpProcess.ErrorDataReceived += (s, e) => { if (!string.IsNullOrEmpty(e.Data)) AppendLog("[PHP] " + e.Data); };

            phpProcess.Start();
            phpProcess.BeginOutputReadLine();
            phpProcess.BeginErrorReadLine();
            AppendLog("Processo PHP Server PID " + phpProcess.Id + " escutando na porta " + port);
        }

        private void OpenGameWindow()
        {
            int port = GetSelectedPort();
            string url = "http://localhost:" + port;
            if (chkAppMode.Checked && !string.IsNullOrEmpty(edgePath) && File.Exists(edgePath))
            {
                AppendLog("Lançando cliente em Modo App Nativo (Edge Standalone)...");
                Process.Start(edgePath, string.Format("--app=\"{0}\" --window-size=1366,768", url));
            }
            else
            {
                AppendLog("Abrindo cliente no navegador padrão...");
                OpenUrl(url);
            }
        }

        private void OpenUrl(string url)
        {
            try
            {
                Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
            }
            catch (Exception ex)
            {
                AppendLog("Erro ao abrir URL: " + ex.Message);
            }
        }

        private void StopAllServers()
        {
            AppendLog("Finalizando servidores...");

            try
            {
                if (serverProcess != null && !serverProcess.HasExited)
                {
                    serverProcess.Kill();
                    serverProcess.Dispose();
                    serverProcess = null;
                    AppendLog("GameServer finalizado.");
                }
            }
            catch { }

            try
            {
                if (phpProcess != null && !phpProcess.HasExited)
                {
                    phpProcess.Kill();
                    phpProcess.Dispose();
                    phpProcess = null;
                    AppendLog("PHP Server finalizado.");
                }
            }
            catch { }

            KillPortProcesses(GetSelectedPort());
            UpdateServerStatus();
            AppendLog("Todos os serviços foram desligados.");
        }

        private void RestartServer()
        {
            AppendLog("Reiniciando servidores...");
            StopAllServers();
            Thread.Sleep(800);
            StartServerAndOpenGame();
        }

        private void KillPortProcesses(int port)
        {
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo("cmd.exe", string.Format("/c for /f \"tokens=5\" %a in ('netstat -aon ^| find \":{0}\" ^| find \"LISTENING\"') do taskkill /f /pid %a", port))
                {
                    CreateNoWindow = true,
                    UseShellExecute = false
                };
                Process p = Process.Start(psi);
                p.WaitForExit(3000);
                AppendLog("Limpeza de processos na porta " + port + " realizada.");
            }
            catch (Exception ex)
            {
                AppendLog("Aviso ao limpar porta: " + ex.Message);
            }
        }

        private void RunBuildGlb()
        {
            AppendLog("Iniciando build/exportação dos GLBs 3D...");
            ThreadPool.QueueUserWorkItem((state) =>
            {
                try
                {
                    ProcessStartInfo psi = new ProcessStartInfo("npm.cmd", "run build:bestiary-glb")
                    {
                        WorkingDirectory = rootDir,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    };
                    using (Process p = Process.Start(psi))
                    {
                        p.OutputDataReceived += (s, e) => { if (!string.IsNullOrEmpty(e.Data)) AppendLog("[Build:Bestiary] " + e.Data); };
                        p.BeginOutputReadLine();
                        p.WaitForExit();
                    }

                    ProcessStartInfo psi2 = new ProcessStartInfo("npm.cmd", "run build:event-glb")
                    {
                        WorkingDirectory = rootDir,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    };
                    using (Process p2 = Process.Start(psi2))
                    {
                        p2.OutputDataReceived += (s, e) => { if (!string.IsNullOrEmpty(e.Data)) AppendLog("[Build:Events] " + e.Data); };
                        p2.BeginOutputReadLine();
                        p2.WaitForExit();
                    }

                    AppendLog("✅ Build dos GLBs 3D finalizado!");
                }
                catch (Exception ex)
                {
                    AppendLog("❌ Falha na geração dos GLBs: " + ex.Message);
                }
            });
        }

        private void AppendLog(string message)
        {
            if (txtConsole.InvokeRequired)
            {
                txtConsole.Invoke(new Action<string>(AppendLog), message);
                return;
            }

            string timestamp = DateTime.Now.ToString("HH:mm:ss");
            txtConsole.AppendText(string.Format("[{0}] {1}\r\n", timestamp, message));
            txtConsole.SelectionStart = txtConsole.Text.Length;
            txtConsole.ScrollToCaret();
        }

        private void RestoreFromTray()
        {
            this.Show();
            this.WindowState = FormWindowState.Normal;
            this.BringToFront();
        }

        [STAThread]
        public static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }
    }
}
