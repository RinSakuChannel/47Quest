$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$questRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$questOut = Join-Path $questRoot 'assets/sounds/voices'
New-Item -ItemType Directory -Force -Path $questOut | Out-Null
$questJson = & node -e "const fs=require('fs'),vm=require('vm');let c={window:{}};vm.runInNewContext(fs.readFileSync('src/character-personalities.js','utf8'),c);process.stdout.write(JSON.stringify(c.window.QUEST_PERSONALITIES));"
$questData = $questJson | ConvertFrom-Json
$questRequestedCode = if ($args.Count) { ([string]$args[0]).PadLeft(2, '0') } else { $null }
$questSynth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$questAvailable = @($questSynth.GetInstalledVoices() | Where-Object { $_.Enabled -and $_.VoiceInfo.Culture.Name -eq 'ja-JP' } | ForEach-Object { $_.VoiceInfo.Name })
if (!$questAvailable.Count) { throw 'No Japanese voice available' }
try {
  foreach ($questEntry in $questData.PSObject.Properties) {
    if ($questRequestedCode -and $questEntry.Name -ne $questRequestedCode) { continue }
    $questPersonality = $questEntry.Value
    $questPreferred = if ($questPersonality.pitch -lt .9) { 'Microsoft Ichiro' } elseif ($questPersonality.pitch -gt 1.1) { 'Microsoft Ayumi' } else { 'Microsoft Sayaka' }
    if ($questAvailable -notcontains $questPreferred) { $questPreferred = $questAvailable[0] }
    $questSynth.SelectVoice($questPreferred)
    $questSynth.Rate = [Math]::Max(-3, [Math]::Min(3,[int][Math]::Round(($questPersonality.rate - 1) * 7)))
    $questFormat = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(12000, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
    $questSynth.SetOutputToWaveFile((Join-Path $questOut ($questEntry.Name + '.wav')), $questFormat)
    $questSynth.Speak([string]$questPersonality.line)
    $questSynth.SetOutputToNull()
    Write-Output ($questEntry.Name + ': ' + $questPreferred)
  }
} finally { $questSynth.Dispose() }
